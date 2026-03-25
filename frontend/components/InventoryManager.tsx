import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductVariant, ProductType } from '../types';
import { productsApi } from '../services/api';
import { Edit2, Plus, Save, X, Sparkles, Package, Trash2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { generateProductDescription } from '../services/geminiService';

interface InventoryManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const VARIANT_TYPES: ProductType[] = [
  'EDP',
  'Extrait',
  'Cologne',
  'Roll-on',
  'Candle',
  'Incense',
  'Diffuser',
  'Backflow Stand',
  'Backflow',
  'Car Perfume',
  'Dhoop Cones',
  'Dhoop Sticks',
  'Floor Cleaner',
  'Air Freshner',
  'Air Freshener',
  'Pain Oil',
  'Essential Oil',
  'Diffuser Oil',
];
const randomImage = () => `https://picsum.photos/400/500?random=${Math.floor(Math.random() * 1000)}`;
const createVariantId = () => `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const createEmptyVariant = (): ProductVariant => ({
  id: createVariantId(),
  name: '',
  type: 'EDP',
  price: 0,
  stock: 0,
  sku: '',
});
const createEmptyProduct = (): Product => ({
  id: '',
  name: '',
  description: '',
  category: 'Fine Fragrance',
  notes: [],
  image: randomImage(),
  variants: [createEmptyVariant()],
});
const cloneProduct = (product: Product): Product => ({
  ...product,
  notes: [...product.notes],
  variants: product.variants.map((variant) => ({ ...variant })),
});
const getStockDraftKey = (productId: string, variantId: string) => `${productId}:${variantId}`;

const validateProductDraft = (product: Product, notesValue: string): string[] => {
  const errors: string[] = [];
  const normalizedNotes = notesValue.split(',').map((note) => note.trim()).filter(Boolean);

  if (!product.name.trim()) {
    errors.push('Product name is required');
  }

  if (!product.description.trim()) {
    errors.push('Product description is required');
  }

  if (!product.image.trim()) {
    errors.push('Product image URL is required');
  }

  if (normalizedNotes.length === 0) {
    errors.push('Add at least one note');
  }

  if (!product.variants.length) {
    errors.push('Add at least one variant');
  }

  const seenSkus = new Set<string>();

  product.variants.forEach((variant, index) => {
    if (!variant.name.trim()) {
      errors.push(`Variant ${index + 1} name is required`);
    }

    if (!variant.sku.trim()) {
      errors.push(`Variant ${index + 1} SKU is required`);
    }

    if (variant.sku.trim() && seenSkus.has(variant.sku.trim())) {
      errors.push(`Duplicate SKU found: ${variant.sku.trim()}`);
    }

    seenSkus.add(variant.sku.trim());

    if (!Number.isFinite(variant.price) || variant.price < 0) {
      errors.push(`Variant ${index + 1} price must be 0 or more`);
    }

    if (!Number.isInteger(variant.stock) || variant.stock < 0) {
      errors.push(`Variant ${index + 1} stock must be a non-negative whole number`);
    }
  });

  return errors;
};

// Minimal CSV parser used only for simple spreadsheets (no external deps)
const parseCSV = (text: string): string[][] => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.map((line) => {
    // naive split on commas, trim quotes and whitespace
    return line.split(',').map((c) => c.replace(/^\"|\"$/g, '').trim());
  });
};

const rowsToProducts = (rows: string[][]): Product[] => {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.toLowerCase());
  const dataRows = rows.slice(1);

  const productsMap: Record<string, Product> = {};

  for (const r of dataRows) {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = r[i] ?? ''));

    // prefer externalId or product name as grouping key
    const key = obj.externalid || obj.productid || obj.productname || `row-${Math.random().toString(36).slice(2, 8)}`;

    const variant: ProductVariant = {
      id: `v_${Math.random().toString(36).slice(2, 9)}`,
      name: obj.variantname || obj.variant || 'Default Variant',
      type: (obj.type as ProductType) || 'EDP',
      price: obj.price ? Number(obj.price) : 0,
      stock: obj.stock ? parseInt(obj.stock) : 0,
      sku: obj.sku || '',
    };

    if (!productsMap[key]) {
      productsMap[key] = {
        id: obj.externalid || '',
        name: obj.productname || obj.name || 'Unnamed Product',
        description: obj.description || '',
        category: (obj.category as any) || 'Fine Fragrance',
        notes: [],
        image: obj.image || `https://picsum.photos/400/500?random=${Math.floor(Math.random() * 1000)}`,
        variants: [variant],
      };
    } else {
      productsMap[key].variants.push(variant);
    }
  }

  return Object.values(productsMap);
};

const validateProducts = (products: Product[]) => {
  const errors: string[] = [];
  for (const p of products) {
    if (!p.name) errors.push(`Product missing name`);
    if (!p.variants || p.variants.length === 0) errors.push(`Product ${p.name || 'unknown'} has no variants`);
    for (const v of p.variants) {
      if (!v.sku) errors.push(`Variant "${v.name || 'unnamed'}" in product "${p.name || 'unknown'}" missing SKU`);
      if (v.price < 0) errors.push(`Variant SKU ${v.sku} has negative price`);
      if (!Number.isInteger(v.stock) || v.stock < 0) errors.push(`Variant SKU ${v.sku} has invalid stock`);
    }
  }
  return errors;
};

export const InventoryManager: React.FC<InventoryManagerProps> = ({ products, setProducts }) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Product>(createEmptyProduct());
  const [tempNotes, setTempNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);

  // Import flow state
  const [importStage, setImportStage] = useState<'idle' | 'preview' | 'confirm' | 'done'>('idle');
  const [parsedProducts, setParsedProducts] = useState<Product[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastFileRef = useRef<File | null>(null);

  useEffect(() => {
    // reset messages when starting a new import
    if (importStage === 'idle') {
      setUploadError(null);
      setUploadSuccess(null);
    }
  }, [importStage]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const handleEdit = (product: Product) => {
    setFormData(cloneProduct(product));
    setTempNotes(product.notes.join(', '));
    setIsEditing(true);
    setProductPendingDelete(null);
    setView('form');
  };

  const handleCreate = () => {
    setFormData(createEmptyProduct());
    setTempNotes('');
    setIsEditing(false);
    setProductPendingDelete(null);
    setView('form');
  };

  const handleSave = async () => {
    const productToSave: Product = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      image: formData.image.trim(),
      notes: tempNotes.split(',').map(s => s.trim()).filter(Boolean),
      variants: formData.variants.map((variant) => ({
        ...variant,
        name: variant.name.trim(),
        sku: variant.sku.trim(),
        price: Number.isFinite(variant.price) ? variant.price : 0,
        stock: Number.isFinite(variant.stock) ? variant.stock : 0,
      })),
    };

    const validationErrors = validateProductDraft(productToSave, tempNotes);
    if (validationErrors.length > 0) {
      showToast('error', validationErrors[0]);
      return;
    }

    setIsSaving(true);

    const result = isEditing && productToSave.id
      ? await productsApi.update(productToSave.id, productToSave)
      : await productsApi.create(productToSave);

    setIsSaving(false);

    if (!result.success || !result.product) {
      showToast('error', result.error || 'Failed to save product');
      return;
    }

    setProducts((prev) => {
      if (isEditing) {
        return prev.map((product) => product.id === result.product!.id ? result.product! : product);
      }

      return [result.product!, ...prev];
    });

    setFormData(cloneProduct(result.product));
    setTempNotes(result.product.notes.join(', '));
    setView('list');
    showToast('success', isEditing ? 'Product updated successfully.' : 'Product created successfully.');
  };

  const handleDeleteRequest = () => {
    if (!isEditing || !formData.id) {
      return;
    }

    setProductPendingDelete(cloneProduct(formData));
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setProductPendingDelete(null);
  };

  const handleDeleteProduct = async () => {
    if (!productPendingDelete?.id) {
      return;
    }

    setIsDeleting(true);
    const deletedProductId = productPendingDelete.id;
    const result = await productsApi.remove(deletedProductId);
    setIsDeleting(false);

    if (!result.success) {
      showToast('error', result.error || 'Failed to delete product');
      return;
    }

    setProducts((prev) => prev.filter((product) => product.id !== deletedProductId));
    setStockDrafts((prev) => Object.fromEntries(
      Object.entries(prev).filter(([key]) => !key.startsWith(`${deletedProductId}:`))
    ));
    setFormData(createEmptyProduct());
    setTempNotes('');
    setIsEditing(false);
    setProductPendingDelete(null);
    setView('list');
    showToast('success', 'Product deleted successfully.');
  };

  const handleGenerateDesc = async () => {
    if (!formData.name) return;
    setIsGenerating(true);
    const notesArray = tempNotes.split(',').map(s => s.trim()).filter(Boolean);
    const desc = await generateProductDescription(formData.name, notesArray);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  // Variant Helpers
  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === id ? { ...v, [field]: value } : v)
    }));
  };

  const addVariant = () => {
    setFormData(prev => ({ ...prev, variants: [...prev.variants, createEmptyVariant()] }));
  };

  const removeVariant = (id: string) => {
    setFormData(prev => ({ ...prev, variants: prev.variants.filter(v => v.id !== id) }));
  };

  // Quick stock update for list view
  const handleQuickStockCommit = async (product: Product, variant: ProductVariant, rawValue: string) => {
    const draftKey = getStockDraftKey(product.id, variant.id);
    const normalizedValue = rawValue.trim();
    const parsedStock = Number(normalizedValue);

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setStockDrafts((prev) => {
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
      showToast('error', 'Stock must be a non-negative whole number.');
      return;
    }

    if (parsedStock === variant.stock) {
      setStockDrafts((prev) => {
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
      return;
    }

    const updatedProduct: Product = {
      ...cloneProduct(product),
      variants: product.variants.map((currentVariant) => (
        currentVariant.id === variant.id
          ? { ...currentVariant, stock: parsedStock }
          : { ...currentVariant }
      )),
    };

    setProducts((prev) => prev.map((currentProduct) => currentProduct.id === product.id ? updatedProduct : currentProduct));

    const result = await productsApi.update(product.id, updatedProduct);

    setStockDrafts((prev) => {
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });

    if (!result.success || !result.product) {
      setProducts((prev) => prev.map((currentProduct) => currentProduct.id === product.id ? product : currentProduct));
      showToast('error', result.error || 'Failed to update stock');
      return;
    }

    setProducts((prev) => prev.map((currentProduct) => currentProduct.id === result.product!.id ? result.product! : currentProduct));
    showToast('success', `${product.name} stock updated successfully.`);
  };

  // Import helpers
  const onFileSelected = async (file?: File) => {
    if (!file) return;
    lastFileRef.current = file;
    setLastFileName(file.name);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const text = await file.text();
      let productsParsed: Product[] = [];

      // Try JSON first
      try {
        const parsed = JSON.parse(text);
        productsParsed = Array.isArray(parsed) ? parsed : parsed.products ?? [];
      } catch (jsonErr) {
        // Fallback to CSV parsing
        if (file.name.toLowerCase().endsWith('.csv')) {
          const rows = parseCSV(text);
          productsParsed = rowsToProducts(rows);
        } else {
          throw new Error('File is not valid JSON or CSV.');
        }
      }

      const errors = validateProducts(productsParsed);
      setParsedProducts(productsParsed);
      setValidationErrors(errors);
      setImportStage('preview');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse file');
      setParsedProducts(null);
      setValidationErrors([]);
      setImportStage('idle');
    }
  };

  const handleConfirmImport = async () => {
    const file = lastFileRef.current;
    if (!file) return setUploadError('No file to import');

    setIsUploading(true);
    setUploadError(null);

    const result = await productsApi.bulkImport(file);

    setIsUploading(false);

    if (result.success) {
      setUploadSuccess(`Imported — ${result.report?.created ?? 0} created, ${result.report?.updated ?? 0} updated`);
      setImportStage('done');
      showToast('success', 'Products imported successfully.');

      // refresh product list from server
      const refreshed = await productsApi.getAll();
      if (refreshed.success && refreshed.products) setProducts(refreshed.products);
    } else {
      setUploadError(result.error || 'Import failed');
      showToast('error', result.error || 'Import failed');
    }
  };

  const handleCancelPreview = () => {
    setParsedProducts(null);
    setValidationErrors([]);
    setImportStage('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
    lastFileRef.current = null;
    setLastFileName(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden flex flex-col h-full">
      {toast && (
        <div className={`fixed top-6 right-6 z-[90] rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
          toast.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="p-6 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
        <div>
           <h2 className="text-xl font-serif font-medium text-brand-900">Inventory Management</h2>
           <p className="text-sm text-brand-500">
             {view === 'list' ? 'Track stock levels and curate the collection.' : isEditing ? 'Edit Product Details' : 'Add New Product'}
           </p>
        </div>
        {view === 'list' ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCreate}
              className="flex items-center gap-2 bg-brand-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition"
            >
              <Plus size={16} /> Add Product
            </button>

            <label className="flex items-center gap-2 bg-white border border-brand-100 px-3 py-2 rounded-lg text-sm text-brand-700 hover:bg-brand-50 cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json,.csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await onFileSelected(file);
                  // clear input to allow re-uploading same file if needed
                  e.currentTarget.value = '';
                }}
              />
              {isUploading ? 'Uploading...' : 'Import JSON'}
            </label>

            <button
              onClick={() => {
                setUploadError(null);
                setUploadSuccess(null);
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="px-3 py-2 rounded-lg bg-brand-50 text-sm text-brand-700 hover:bg-brand-100 transition"
            >
              Browse
            </button>
          </div>
        ) : (
          <button 
            onClick={() => {
              setProductPendingDelete(null);
              setView('list');
            }}
            className="text-brand-500 hover:text-brand-800 transition"
          >
            <X size={24} />
          </button>
        )}
      </div>



      <div className="flex-1 overflow-y-auto p-6">
        {importStage === 'preview' && parsedProducts && (
          <div className="max-w-4xl mx-auto mb-6 bg-white rounded-lg p-6 border">
            <h3 className="font-serif text-lg mb-2">Import Preview {lastFileName ? `— ${lastFileName}` : ''}</h3>
            <p className="text-sm text-brand-500 mb-4">Products: {parsedProducts.length}. Validation errors: {validationErrors.length}</p>

            {validationErrors.length > 0 && (
              <div className="mb-3 text-sm text-red-600">
                <strong>Errors:</strong>
                <ul className="list-disc ml-5">
                  {validationErrors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <div className="mb-4 border rounded overflow-hidden">
              {parsedProducts.slice(0, 5).map((p, idx) => (
                <div key={idx} className="p-3 border-b last:border-b-0">
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-brand-500">{p.category} • {p.variants.length} variants</div>
                    </div>
                    <div className="text-xs text-brand-500">Image: {p.image ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={handleCancelPreview} className="px-4 py-2 rounded-lg text-sm border">Cancel</button>
              <button onClick={handleConfirmImport} disabled={isUploading || validationErrors.length > 0} className="px-4 py-2 rounded-lg bg-brand-900 text-white">
                {isUploading ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        )}

        {view === 'form' ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Main Product Info */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-4">
                 <div className="aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden border border-brand-200 relative group">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-white text-xs font-medium">Image Preview</span>
                    </div>
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Image URL</label>
                   <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4"/>
                    <input 
                      value={formData.image}
                      onChange={e => setFormData({...formData, image: e.target.value})}
                      className="w-full pl-9 pr-4 py-2 bg-brand-50 border border-brand-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                    />
                   </div>
                 </div>
              </div>

              <div className="md:col-span-8 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Product Name</label>
                     <input 
                       value={formData.name}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                       className="w-full px-4 py-2 bg-brand-50 border border-brand-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                       placeholder="e.g. Midnight Jasmine"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Category</label>
                     <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as any})}
                        className="w-full px-4 py-2 bg-brand-50 border border-brand-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                     >
                        <option value="Fine Fragrance">Fine Fragrance</option>
                        <option value="Home Collection">Home Collection</option>
                        <option value="Accessories">Accessories</option>
                     </select>
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
                     Olfactory Notes <span className="text-brand-400 normal-case font-normal">(comma separated)</span>
                   </label>
                   <input 
                     value={tempNotes}
                     onChange={e => setTempNotes(e.target.value)}
                     className="w-full px-4 py-2 bg-brand-50 border border-brand-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                     placeholder="e.g. Bergamot, Oud, Vanilla"
                   />
                 </div>

                 <div className="relative">
                    <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 bg-brand-50 border border-brand-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-400 outline-none leading-relaxed"
                    />
                    <button 
                      onClick={handleGenerateDesc}
                      disabled={isGenerating || !formData.name}
                      className="absolute bottom-3 right-3 text-xs bg-white text-brand-800 px-3 py-1.5 rounded shadow-sm border border-brand-100 flex items-center gap-1.5 hover:bg-brand-50 transition"
                    >
                      <Sparkles size={12}/> {isGenerating ? 'Drafting...' : 'AI Generate'}
                    </button>
                 </div>
              </div>
            </div>

            {/* Variants Section */}
            <div className="bg-brand-50 rounded-xl border border-brand-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-brand-200 flex justify-between items-center bg-brand-100/50">
                  <h3 className="font-serif text-brand-900">Product Variants</h3>
                  <button 
                    onClick={addVariant}
                    className="text-xs flex items-center gap-1 text-brand-700 hover:text-brand-900 font-medium"
                  >
                    <Plus size={14} /> Add Variant
                  </button>
               </div>
               
               <div className="p-4 space-y-3">
                 {formData.variants.length === 0 ? (
                    <div className="text-center py-8 text-brand-400">
                      <AlertCircle size={24} className="mx-auto mb-2 opacity-50"/>
                      <p className="text-sm">No variants added. Add at least one variant.</p>
                    </div>
                 ) : (
                   formData.variants.map((variant, index) => (
                     <div key={variant.id} className="grid grid-cols-12 gap-3 items-end p-3 bg-white rounded-lg border border-brand-200 shadow-sm">
                        <div className="col-span-3">
                           <label className="text-[10px] text-brand-400 uppercase font-semibold block mb-1">Name</label>
                           <input 
                             value={variant.name}
                             onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                             placeholder="e.g. 50ml Bottle"
                             className="w-full p-2 text-sm border border-brand-100 rounded bg-brand-50 focus:border-brand-300 outline-none"
                           />
                        </div>
                        <div className="col-span-3">
                           <label className="text-[10px] text-brand-400 uppercase font-semibold block mb-1">Type</label>
                           <select 
                             value={variant.type}
                             onChange={(e) => updateVariant(variant.id, 'type', e.target.value)}
                             className="w-full p-2 text-sm border border-brand-100 rounded bg-brand-50 focus:border-brand-300 outline-none"
                           >
                             {VARIANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                           </select>
                        </div>
                        <div className="col-span-2">
                           <label className="text-[10px] text-brand-400 uppercase font-semibold block mb-1">SKU</label>
                           <input 
                             value={variant.sku}
                             onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                             className="w-full p-2 text-sm border border-brand-100 rounded bg-brand-50 focus:border-brand-300 outline-none"
                           />
                        </div>
                        <div className="col-span-3 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-brand-400 uppercase font-semibold block mb-1">Price</label>
                            <input 
                              type="number"
                              value={variant.price}
                              onChange={(e) => updateVariant(variant.id, 'price', Number(e.target.value))}
                              className="w-full p-2 text-sm border border-brand-100 rounded bg-brand-50 focus:border-brand-300 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-brand-400 uppercase font-semibold block mb-1">Stock</label>
                            <input 
                              type="number"
                              value={variant.stock}
                              onChange={(e) => updateVariant(variant.id, 'stock', Number(e.target.value))}
                              className="w-full p-2 text-sm border border-brand-100 rounded bg-brand-50 focus:border-brand-300 outline-none"
                            />
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center pb-2">
                           <button onClick={() => removeVariant(variant.id)} className="text-brand-300 hover:text-red-500 transition">
                             <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                   ))
                 )}
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-brand-100">
              {isEditing && formData.id && (
                <button
                  onClick={handleDeleteRequest}
                  disabled={isSaving || isDeleting}
                  className="mr-auto inline-flex items-center gap-2 rounded-lg border border-red-200 px-5 py-2.5 font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} /> Delete Product
                </button>
              )}
              <button 
                onClick={() => {
                  setProductPendingDelete(null);
                  setView('list');
                }}
                className="px-6 py-2.5 rounded-lg text-brand-600 font-medium hover:bg-brand-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-2.5 rounded-lg bg-brand-900 text-white font-medium hover:bg-brand-800 transition shadow-lg shadow-brand-900/10 flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="border border-brand-100 rounded-lg p-4 hover:shadow-md transition bg-white group">
                <div className="flex items-start gap-5">
                  <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-brand-100">
                    <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                         <h3 className="font-serif text-lg text-brand-900 font-medium">{product.name}</h3>
                         <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded border border-brand-100">
                           {product.category}
                         </span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-2 text-brand-400 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={16}/>
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-brand-500 mb-4 line-clamp-1">{product.description}</p>
                    
                    <div className="bg-brand-50/50 rounded-lg p-3 border border-brand-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {product.variants.map(variant => (
                          <div key={variant.id} className="flex items-center justify-between bg-white p-2 rounded border border-brand-100/50 shadow-sm">
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-brand-800 block truncate">{variant.name}</span>
                              <span className="text-[10px] text-brand-400">{variant.sku || 'No SKU'} • ₹{variant.price}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                               <span className="text-[10px] uppercase text-brand-400">Stock</span>
                               {(() => {
                                 const draftKey = getStockDraftKey(product.id, variant.id);
                                 const stockValue = stockDrafts[draftKey] ?? String(variant.stock);

                                 return (
                                   <input 
                                     type="number"
                                     value={stockValue}
                                     onChange={(e) => setStockDrafts((prev) => ({
                                       ...prev,
                                       [draftKey]: e.target.value,
                                     }))}
                                     onBlur={() => void handleQuickStockCommit(product, variant, stockValue)}
                                     onKeyDown={(e) => {
                                       if (e.key === 'Enter') {
                                         e.currentTarget.blur();
                                       }
                                     }}
                                     className="w-14 text-center text-xs border border-brand-200 rounded py-1 focus:ring-1 focus:ring-brand-400 outline-none"
                                   />
                                 );
                               })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {products.length === 0 && (
              <div className="text-center py-20 text-brand-300">
                <Package size={48} className="mx-auto mb-4 opacity-50"/>
                <p>Inventory is empty.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {productPendingDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-950/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>
            <h3 className="text-xl font-serif text-brand-900">Delete this product?</h3>
            <p className="mt-3 text-sm leading-relaxed text-brand-600">
              This will permanently remove <span className="font-semibold text-brand-900">{productPendingDelete.name}</span> and all of its variants from the database.
            </p>
            <p className="mt-2 text-sm text-red-600">This action cannot be undone.</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDeleteProduct()}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
