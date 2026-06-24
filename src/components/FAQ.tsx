import React, { useState, useMemo } from 'react';
import { 
  Search, ChevronDown, ChevronUp, BookOpen, Sparkles, HelpCircle, X, Hash, Info, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { faqCategories } from '../data/faqData';

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});

  // Helper to toggle a single FAQ item
  const toggleFaq = (id: number) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Extract all items into a single flat array with category context for stats
  const allFaqItems = useMemo(() => {
    return faqCategories.flatMap(cat => 
      cat.items.map(item => ({
        ...item,
        category: cat.category
      }))
    );
  }, []);

  // Filter categories and items based on search query and selected category
  const filteredCategories = useMemo(() => {
    return faqCategories
      .map(catGroup => {
        if (selectedCategory !== 'All' && catGroup.category !== selectedCategory) {
          return null;
        }
        const filteredItems = catGroup.items.filter(item => 
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return filteredItems.length > 0 ? { ...catGroup, items: filteredItems } : null;
      })
      .filter((cat): cat is typeof faqCategories[0] => cat !== null);
  }, [searchQuery, selectedCategory]);

  // Calculate total filtered items count
  const filteredCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [filteredCategories]);

  // Toggle all items in the current filtered view
  const isAllExpanded = useMemo(() => {
    if (filteredCount === 0) return false;
    return filteredCategories.every(cat => 
      cat.items.every(item => !!expandedFaqs[item.id])
    );
  }, [filteredCategories, expandedFaqs, filteredCount]);

  const toggleAll = () => {
    if (isAllExpanded) {
      // Collapse all currently visible items
      setExpandedFaqs(prev => {
        const next = { ...prev };
        filteredCategories.forEach(cat => {
          cat.items.forEach(item => {
            next[item.id] = false;
          });
        });
        return next;
      });
    } else {
      // Expand all currently visible items
      setExpandedFaqs(prev => {
        const next = { ...prev };
        filteredCategories.forEach(cat => {
          cat.items.forEach(item => {
            next[item.id] = true;
          });
        });
        return next;
      });
    }
  };

  // Render highlighted text for search queries
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={index} className="bg-[#8A2BFF]/30 text-[#38F8B0] font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Count items per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = { All: allFaqItems.length };
    faqCategories.forEach(cat => {
      stats[cat.category] = cat.items.length;
    });
    return stats;
  }, [allFaqItems]);

  return (
    <div className="space-y-4 font-sans">
      {/* Visual Feedback Engine Loop Intro */}
      <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-4 space-y-3 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#8A2BFF]/5 blur-2xl"></div>
        
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-white">
              <BookOpen className="h-4 w-4 text-[#B066FF]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Ecosystem Knowledge Base
              </h3>
            </div>
            <p className="text-[11px] text-[#A9A3B8] leading-relaxed">
              Explore our comprehensive database of 30 questions covering platform mechanics, token utility, campaign parameters, and security policies.
            </p>
          </div>
          
          <div className="shrink-0 bg-[#05020D]/80 border border-[#A9A3B8]/10 rounded-lg p-2 text-right">
            <span className="text-[16px] font-bold font-mono text-[#38F8B0] block leading-none">30</span>
            <span className="text-[7px] font-mono tracking-wider text-[#A9A3B8] uppercase">TOTAL FAQS</span>
          </div>
        </div>

        {/* Quick Help Tip */}
        <div className="p-2 rounded-lg bg-[#38F8B0]/5 border border-[#38F8B0]/10 flex items-center gap-2 text-[10px] text-emerald-200/90 font-mono">
          <Sparkles className="h-3.5 w-3.5 text-[#38F8B0] shrink-0" />
          <span>Tips: Use category tabs to narrow your view. Type keywords to highlight matched terms live.</span>
        </div>
      </div>

      {/* Control Panel: Search & Global Toggles */}
      <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Input Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#A9A3B8]/60" />
            <input
              id="faq-search-box-input"
              type="text"
              placeholder="Search by keyword (e.g., wallet, escrow, claim)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#05020D] text-white rounded-lg border border-[#A9A3B8]/10 focus:border-[#8A2BFF] focus:outline-none placeholder-[#A9A3B8]/40 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                id="btn-faq-clear-search"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 p-0.5 text-[#A9A3B8]/60 hover:text-white rounded"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Expand/Collapse All Button */}
          {filteredCount > 0 && (
            <button
              type="button"
              id="btn-faq-toggle-all"
              onClick={toggleAll}
              className="px-3 py-2 text-[10px] font-bold font-mono uppercase tracking-wide rounded-lg border border-[#A9A3B8]/10 bg-[#05020D] text-[#A9A3B8] hover:text-white hover:border-[#8A2BFF]/35 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {isAllExpanded ? <ChevronUp className="h-3.5 w-3.5 text-rose-400" /> : <ChevronDown className="h-3.5 w-3.5 text-emerald-400" />}
              <span>{isAllExpanded ? 'Collapse All' : 'Expand All'}</span>
            </button>
          )}
        </div>

        {/* High-density category selector chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {['All', 'Platform Basics', 'Promotion & Campaigns', 'Tokens & Rewards', 'Wallets, Fees & Settings'].map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryStats[cat] || 0;
            return (
              <button
                key={cat}
                type="button"
                id={`btn-faq-category-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => {
                  setSelectedCategory(cat);
                }}
                className={`px-2.5 py-1.5 text-[9px] font-bold font-mono uppercase tracking-wide rounded-md border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#8A2BFF]/25 border-[#8A2BFF]/60 text-[#B066FF] shadow-[0_0_10px_rgba(138,43,255,0.15)]'
                    : 'bg-[#05020D]/60 border-[#A9A3B8]/10 text-[#A9A3B8] hover:text-white hover:border-[#A9A3B8]/25'
                }`}
              >
                <span>{cat}</span>
                <span className={`px-1 rounded-sm text-[8px] font-semibold ${
                  isSelected ? 'bg-[#8A2BFF]/30 text-white' : 'bg-[#05020D] text-[#A9A3B8]/60 border border-[#A9A3B8]/5'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Cards Accordion Grid */}
      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="rounded-xl border border-[#A9A3B8]/15 bg-[#0B0618]/80 glass p-8 text-center text-xs text-[#A9A3B8]">
            No answers match your query "<strong>{searchQuery}</strong>". Try a different search term or category.
          </div>
        ) : (
          filteredCategories.map((catGroup) => (
            <div key={catGroup.category} className="space-y-2">
              {/* Category Heading Banner */}
              <div className="flex items-center gap-2 px-1 pt-1 justify-between">
                <h4 className="text-[9px] font-bold font-mono text-[#B066FF] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-[#B066FF] rounded-full"></span>
                  {catGroup.category}
                </h4>
                <span className="text-[8px] font-mono text-[#A9A3B8]/50">
                  {catGroup.items.length} {catGroup.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Accordion List for this category */}
              <div className="grid gap-2">
                {catGroup.items.map((item) => {
                  const isExpanded = !!expandedFaqs[item.id];
                  return (
                    <div 
                      key={item.id}
                      className={`rounded-xl border transition-all ${
                        isExpanded 
                          ? 'bg-[#0B0618]/90 border-[#8A2BFF]/40 shadow-[0_4px_16px_rgba(138,43,255,0.06)]' 
                          : 'bg-[#0B0618]/45 border-[#A9A3B8]/10 hover:border-[#A9A3B8]/20 hover:bg-[#0B0618]/60'
                      }`}
                    >
                      {/* Trigger Header */}
                      <button
                        type="button"
                        id={`faq-item-toggle-${item.id}`}
                        onClick={() => toggleFaq(item.id)}
                        className="w-full text-left p-3 flex items-start justify-between gap-3 cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="mt-0.5 shrink-0 flex items-center justify-center h-4 w-4 rounded bg-[#05020D]/80 border border-[#A9A3B8]/10 text-[#A9A3B8]/60 font-mono text-[9px] font-semibold">
                            {item.id}
                          </span>
                          <span className="text-xs font-bold text-white leading-relaxed font-sans">
                            {highlightText(item.question, searchQuery)}
                          </span>
                        </div>
                        <span className={`p-0.5 shrink-0 bg-[#05020D]/60 rounded-full border border-[#A9A3B8]/5 text-[#A9A3B8]/80 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-[#B066FF] border-[#8A2BFF]/20' : ''
                        }`}>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </span>
                      </button>

                      {/* Expandable Panel */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3.5 pt-1 text-[11px] text-[#A9A3B8] leading-relaxed border-t border-[#A9A3B8]/5 font-sans">
                              <p className="bg-[#05020D]/30 p-2.5 rounded-lg border border-[#A9A3B8]/5">
                                {highlightText(item.answer, searchQuery)}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
