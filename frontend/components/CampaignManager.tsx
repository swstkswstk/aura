import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Plus, Calendar, BarChart2, Edit3, 
  Trash2, Sparkles, Check, X, Clock 
} from 'lucide-react';
import { Campaign, Customer } from '../types';
import { generateCampaignContent } from '../services/geminiService';

interface CampaignManagerProps {
  customers: Customer[];
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Summer Solstice Launch',
    status: 'Sent',
    targetSegment: 'VIP',
    subject: 'The Sun, Captured in Glass',
    content: 'Dear valued collector, embrace the warmth of our newest solar accord. Available exclusively to our inner circle.',
    scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    stats: { sent: 120, opened: 88, clicked: 45 }
  },
  {
    id: '2',
    name: 'Re-engagement: Missing You',
    status: 'Scheduled',
    targetSegment: 'At Risk',
    subject: 'A Scent to Remember',
    content: 'It has been some time since you last visited our garden. We have reserved a complimentary sample set for your return.',
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 48), // 2 days from now
  }
];

export const CampaignManager: React.FC<CampaignManagerProps> = ({ customers }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [formState, setFormState] = useState<{
    name: string;
    targetSegment: Campaign['targetSegment'];
    topic: string;
    subject: string;
    content: string;
    date: string;
  }>({
    name: '',
    targetSegment: 'All',
    topic: '',
    subject: '',
    content: '',
    date: ''
  });

  const getAudienceCount = (segment: string) => {
    if (segment === 'All') return customers.length;
    return customers.filter(c => c.status === segment).length;
  };

  const handleGenerate = async () => {
    if (!formState.topic) return;
    setIsGenerating(true);
    const result = await generateCampaignContent(formState.topic, formState.targetSegment);
    setFormState(prev => ({
      ...prev,
      subject: result.subject,
      content: result.body
    }));
    setIsGenerating(false);
  };

  const handleCreate = () => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: formState.name || 'Untitled Campaign',
      status: 'Scheduled',
      targetSegment: formState.targetSegment,
      subject: formState.subject,
      content: formState.content,
      scheduledDate: new Date(formState.date || Date.now()),
      stats: { sent: 0, opened: 0, clicked: 0 }
    };
    
    setCampaigns(prev => [newCampaign, ...prev]);
    setIsCreating(false);
    // Reset form
    setFormState({
      name: '',
      targetSegment: 'All',
      topic: '',
      subject: '',
      content: '',
      date: ''
    });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
        <div>
          <h2 className="text-xl font-serif font-medium text-brand-900">Campaigns</h2>
          <p className="text-sm text-brand-500">Orchestrate customer journeys and broadcast moments.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-brand-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition"
        >
          <Plus size={16} /> New Campaign
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative">
        <AnimatePresence mode="wait">
          {isCreating ? (
            <motion.div 
              key="create-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto bg-white rounded-xl border border-brand-200 p-8 shadow-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-serif text-brand-900">Compose Campaign</h3>
                <button onClick={() => setIsCreating(false)} className="text-brand-400 hover:text-brand-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Campaign Name</label>
                    <input 
                      type="text" 
                      value={formState.name}
                      onChange={e => setFormState({...formState, name: e.target.value})}
                      placeholder="e.g. Winter Collection Teaser"
                      className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
                      Target Audience ({getAudienceCount(formState.targetSegment)} users)
                    </label>
                    <select 
                      value={formState.targetSegment}
                      onChange={e => setFormState({...formState, targetSegment: e.target.value as any})}
                      className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                    >
                      <option value="All">All Customers</option>
                      <option value="VIP">VIP</option>
                      <option value="Active">Active</option>
                      <option value="Lead">Leads</option>
                      <option value="At Risk">At Risk</option>
                    </select>
                  </div>
                </div>

                <div className="bg-brand-50 p-4 rounded-lg border border-brand-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-brand-600 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={14} /> AI Content Assistant
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={formState.topic}
                      onChange={e => setFormState({...formState, topic: e.target.value})}
                      placeholder="Describe what you want to communicate (e.g., 'Announce new jasmine scent for VIPs')"
                      className="flex-1 bg-white border border-brand-200 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                    />
                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !formState.topic}
                      className="bg-brand-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
                    >
                      {isGenerating ? 'Drafting...' : 'Generate'}
                    </button>
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Subject Line</label>
                   <input 
                      type="text" 
                      value={formState.subject}
                      onChange={e => setFormState({...formState, subject: e.target.value})}
                      className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-brand-400 outline-none font-medium text-brand-900"
                    />
                </div>

                <div>
                   <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Email Body</label>
                   <textarea 
                      rows={6}
                      value={formState.content}
                      onChange={e => setFormState({...formState, content: e.target.value})}
                      className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-brand-400 outline-none text-brand-800 leading-relaxed"
                    />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-brand-100">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-brand-400"/>
                    <input 
                      type="date" 
                      value={formState.date}
                      onChange={e => setFormState({...formState, date: e.target.value})}
                      className="bg-transparent text-sm text-brand-600 border-none outline-none focus:ring-0 cursor-pointer" 
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsCreating(false)}
                      className="px-6 py-2.5 text-brand-600 text-sm font-medium hover:bg-brand-50 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreate}
                      disabled={!formState.subject || !formState.content}
                      className="flex items-center gap-2 bg-brand-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-800 transition shadow-lg shadow-brand-900/10 disabled:opacity-50"
                    >
                      <Send size={16} /> Schedule Campaign
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4"
            >
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white border border-brand-100 rounded-xl p-6 hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl
                        ${campaign.status === 'Sent' ? 'bg-green-100 text-green-700' : 
                          campaign.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                      `}>
                         {campaign.status === 'Sent' ? <Check size={20}/> : campaign.status === 'Scheduled' ? <Clock size={20}/> : <Edit3 size={20}/>}
                      </div>
                      <div>
                        <h3 className="text-lg font-serif font-medium text-brand-900">{campaign.name}</h3>
                        <p className="text-sm text-brand-500 mt-1">
                          <span className="font-medium text-brand-700">{campaign.subject}</span>
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-brand-400">
                          <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(campaign.scheduledDate).toLocaleDateString()}</span>
                          <span className="px-2 py-0.5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 uppercase tracking-wide text-[10px]">
                            To: {campaign.targetSegment}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-brand-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
                    </div>
                  </div>

                  {campaign.status === 'Sent' && campaign.stats && (
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-brand-50">
                      <div>
                        <span className="text-xs text-brand-400 uppercase tracking-wider">Sent</span>
                        <div className="text-lg font-semibold text-brand-800">{campaign.stats.sent}</div>
                      </div>
                      <div>
                        <span className="text-xs text-brand-400 uppercase tracking-wider">Open Rate</span>
                        <div className="text-lg font-semibold text-brand-800">
                          {Math.round((campaign.stats.opened / campaign.stats.sent) * 100)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-brand-400 uppercase tracking-wider">Click Rate</span>
                        <div className="text-lg font-semibold text-brand-800">
                           {Math.round((campaign.stats.clicked / campaign.stats.sent) * 100)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {campaign.status !== 'Sent' && (
                    <div className="mt-4 pt-4 border-t border-brand-50 text-sm text-brand-400 italic">
                      Scheduled for automatic dispatch. Content locked.
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
