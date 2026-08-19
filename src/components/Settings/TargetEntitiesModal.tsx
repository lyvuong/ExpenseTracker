import React, { useMemo, useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  Tag
} from 'lucide-react';
import type {
  ExpenseTarget,
  FamilyMember,
  Office,
  Target,
  TargetEntity,
  TargetTaxonomyOverride,
  TaxonomyOverrideDoc,
  Trip
} from '../../types';
import {
  CATEGORY_TAXONOMY_BASE,
  TARGET_META,
  getCategoryMeta
} from '../../constants/categories';

interface TargetEntitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: Target;
  trips: Trip[];
  offices: Office[];
  familyMembers: FamilyMember[];
  onSaveEntity: (collectionName: string, entity: TargetEntity) => Promise<void> | void;
  onDeleteEntity: (collectionName: string, id: string) => Promise<void> | void;
  taxonomyOverrideDoc: TaxonomyOverrideDoc;
  onSaveTaxonomy: (target: string, override: TargetTaxonomyOverride) => Promise<void> | void;
}

export const TargetEntitiesModal: React.FC<TargetEntitiesModalProps> = ({
  isOpen,
  onClose,
  initialTarget = 'Family',
  trips,
  offices,
  familyMembers,
  onSaveEntity,
  onDeleteEntity,
  taxonomyOverrideDoc,
  onSaveTaxonomy
}) => {
  const [activeTarget, setActiveTarget] = useState<Target>(initialTarget);
  const [activeTab, setActiveTab] = useState<'entities' | 'categories'>('categories');

  // Entity Management State
  const [isEntityFormOpen, setIsEntityFormOpen] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [entityName, setEntityName] = useState('');
  const [entityDateStart, setEntityDateStart] = useState('');
  const [entityDateEnd, setEntityDateEnd] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityNotes, setEntityNotes] = useState('');

  // Category Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Category Add / Rename State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySubs, setNewCategorySubs] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [renameCategoryVal, setRenameCategoryVal] = useState('');

  // Subcategory Add / Rename State
  const [addingSubcatFor, setAddingSubcatFor] = useState<string | null>(null);
  const [newSubcatName, setNewSubcatName] = useState('');
  const [editingSubcatKey, setEditingSubcatKey] = useState<string | null>(null);
  const [renameSubcatVal, setRenameSubcatVal] = useState('');

  const targetMeta = TARGET_META[activeTarget] || TARGET_META.Family;

  // Active target's current override
  const currentOverride: TargetTaxonomyOverride = useMemo(() => {
    return taxonomyOverrideDoc[activeTarget] || { categories: {}, deleted: [] };
  }, [taxonomyOverrideDoc, activeTarget]);

  // Derived effective category & subcategory lists for the active target
  const { allCategoriesWithStatus, activeCount, deletedCount } = useMemo(() => {
    const base = CATEGORY_TAXONOMY_BASE[activeTarget] || {};
    const deletedSet = new Set(currentOverride.deleted || []);
    const customCats = currentOverride.categories || {};

    const categoryMap = new Map<
      string,
      {
        name: string;
        isCustom: boolean;
        isDeleted: boolean;
        subcategories: { name: string; isCustom: boolean; isDeleted: boolean }[];
      }
    >();

    // 1. Process base categories
    for (const [catName, baseSubs] of Object.entries(base)) {
      const isCatDeleted = deletedSet.has(catName);
      const customSubList = customCats[catName] || [];
      const combinedSubNames = Array.from(new Set([...baseSubs, ...customSubList]));

      const subcategories = combinedSubNames.map(subName => {
        const isSubDeleted = isCatDeleted || deletedSet.has(`${catName}::${subName}`);
        const isSubCustom = !baseSubs.includes(subName);
        return { name: subName, isCustom: isSubCustom, isDeleted: isSubDeleted };
      });

      categoryMap.set(catName, {
        name: catName,
        isCustom: false,
        isDeleted: isCatDeleted,
        subcategories
      });
    }

    // 2. Process custom categories
    for (const [catName, customSubs] of Object.entries(customCats)) {
      if (!categoryMap.has(catName)) {
        const isCatDeleted = deletedSet.has(catName);
        const subcategories = customSubs.map(subName => ({
          name: subName,
          isCustom: true,
          isDeleted: isCatDeleted || deletedSet.has(`${catName}::${subName}`)
        }));

        categoryMap.set(catName, {
          name: catName,
          isCustom: true,
          isDeleted: isCatDeleted,
          subcategories
        });
      }
    }

    const all = Array.from(categoryMap.values());
    const active = all.filter(c => !c.isDeleted).length;
    const deleted = all.filter(c => c.isDeleted).length;

    return { allCategoriesWithStatus: all, activeCount: active, deletedCount: deleted };
  }, [activeTarget, currentOverride]);

  const filteredCategories = useMemo(() => {
    let result = allCategoriesWithStatus;
    if (!showDeleted) {
      result = result.filter(c => !c.isDeleted);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.subcategories.some(s => s.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [allCategoriesWithStatus, showDeleted, searchTerm]);

  // Active Target Entity List (Trips for Travel, Offices for Business, Members for Family)
  const entitiesForTarget = useMemo(() => {
    switch (activeTarget) {
      case 'Travel':
        return trips;
      case 'Business':
        return offices;
      case 'Family':
        return familyMembers;
      default:
        return [];
    }
  }, [activeTarget, trips, offices, familyMembers]);

  if (!isOpen) return null;

  // Taxonomy Handlers
  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const subs = newCategorySubs
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const updatedCategories = {
      ...(currentOverride.categories || {}),
      [name]: subs
    };

    const updatedDeleted = (currentOverride.deleted || []).filter(d => d !== name);

    onSaveTaxonomy(activeTarget, {
      categories: updatedCategories,
      deleted: updatedDeleted
    });

    setNewCategoryName('');
    setNewCategorySubs('');
    setIsAddingCategory(false);
  };

  const handleRenameCategory = (oldName: string) => {
    const next = renameCategoryVal.trim();
    if (!next || next === oldName) {
      setEditingCategoryName(null);
      return;
    }

    const currentCustom = currentOverride.categories || {};
    const subs = currentCustom[oldName] || CATEGORY_TAXONOMY_BASE[activeTarget]?.[oldName] || [];

    const updatedCategories = { ...currentCustom };
    delete updatedCategories[oldName];
    updatedCategories[next] = subs;

    const updatedDeleted = Array.from(new Set([...(currentOverride.deleted || []), oldName]));

    onSaveTaxonomy(activeTarget, {
      categories: updatedCategories,
      deleted: updatedDeleted
    });

    setEditingCategoryName(null);
  };

  const handleToggleHideCategory = (catName: string, currentlyDeleted: boolean) => {
    let updatedDeleted: string[];
    if (currentlyDeleted) {
      updatedDeleted = (currentOverride.deleted || []).filter(d => d !== catName && !d.startsWith(`${catName}::`));
    } else {
      updatedDeleted = Array.from(new Set([...(currentOverride.deleted || []), catName]));
    }

    onSaveTaxonomy(activeTarget, {
      categories: currentOverride.categories || {},
      deleted: updatedDeleted
    });
  };

  const handleAddSubcategory = (parentCategory: string) => {
    const subName = newSubcatName.trim();
    if (!subName) return;

    const currentCustom = currentOverride.categories || {};
    const existingSubs = currentCustom[parentCategory] || CATEGORY_TAXONOMY_BASE[activeTarget]?.[parentCategory] || [];
    const updatedSubs = Array.from(new Set([...existingSubs, subName]));

    const updatedCategories = {
      ...currentCustom,
      [parentCategory]: updatedSubs
    };

    const updatedDeleted = (currentOverride.deleted || []).filter(d => d !== `${parentCategory}::${subName}`);

    onSaveTaxonomy(activeTarget, {
      categories: updatedCategories,
      deleted: updatedDeleted
    });

    setNewSubcatName('');
    setAddingSubcatFor(null);
  };

  const handleRenameSubcategory = (parentCategory: string, oldSub: string) => {
    const next = renameSubcatVal.trim();
    if (!next || next === oldSub) {
      setEditingSubcatKey(null);
      return;
    }

    const currentCustom = currentOverride.categories || {};
    const existingSubs = currentCustom[parentCategory] || CATEGORY_TAXONOMY_BASE[activeTarget]?.[parentCategory] || [];
    const updatedSubs = existingSubs.map(s => (s === oldSub ? next : s));

    const updatedCategories = {
      ...currentCustom,
      [parentCategory]: updatedSubs
    };

    const updatedDeleted = Array.from(new Set([...(currentOverride.deleted || []), `${parentCategory}::${oldSub}`]));

    onSaveTaxonomy(activeTarget, {
      categories: updatedCategories,
      deleted: updatedDeleted
    });

    setEditingSubcatKey(null);
  };

  const handleToggleHideSubcategory = (parentCategory: string, subName: string, currentlyDeleted: boolean) => {
    const key = `${parentCategory}::${subName}`;
    let updatedDeleted: string[];
    if (currentlyDeleted) {
      updatedDeleted = (currentOverride.deleted || []).filter(d => d !== key);
    } else {
      updatedDeleted = Array.from(new Set([...(currentOverride.deleted || []), key]));
    }

    onSaveTaxonomy(activeTarget, {
      categories: currentOverride.categories || {},
      deleted: updatedDeleted
    });
  };

  const handleResetTargetTaxonomy = () => {
    if (!confirm(`Reset ${activeTarget} categories and subcategories back to default factory settings?`)) return;
    onSaveTaxonomy(activeTarget, {
      categories: {},
      deleted: []
    });
  };

  // Entity Handlers
  const handleOpenNewEntity = () => {
    setEditingEntityId(null);
    setEntityName('');
    setEntityDateStart('');
    setEntityDateEnd('');
    setEntityType('');
    setEntityNotes('');
    setIsEntityFormOpen(true);
  };

  const handleOpenEditEntity = (entity: any) => {
    setEditingEntityId(entity.id);
    setEntityName(entity.name || '');
    setEntityDateStart(entity.startDate || '');
    setEntityDateEnd(entity.endDate || '');
    setEntityType(entity.tripType || entity.officeType || '');
    setEntityNotes(entity.notes || '');
    setIsEntityFormOpen(true);
  };

  const handleSaveEntityForm = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!entityName.trim()) return;

    const id = editingEntityId || `${targetMeta.collectionName.slice(0, 4)}-${Date.now()}`;

    let entityToSave: TargetEntity;
    switch (activeTarget) {
      case 'Travel':
        entityToSave = {
          id,
          name: entityName.trim(),
          startDate: entityDateStart || undefined,
          endDate: entityDateEnd || undefined,
          tripType: entityType || undefined,
          notes: entityNotes.trim() || undefined
        } as Trip;
        break;
      case 'Business':
        entityToSave = {
          id,
          name: entityName.trim(),
          officeType: entityType || undefined,
          notes: entityNotes.trim() || undefined
        } as Office;
        break;
      case 'Family':
        entityToSave = {
          id,
          name: entityName.trim(),
          notes: entityNotes.trim() || undefined
        } as FamilyMember;
        break;
      default:
        return;
    }

    await onSaveEntity(targetMeta.collectionName, entityToSave);
    setIsEntityFormOpen(false);
  };

  const handleDeleteEntityConfirm = async (id: string) => {
    if (!confirm(`Delete this ${targetMeta.entityLabel}?`)) return;
    await onDeleteEntity(targetMeta.collectionName, id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 no-print">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Manage Domains, Entities & Taxonomy</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Domain Switcher Pills (Family, Travel, Business) */}
        <div className="px-5 pt-4 pb-2 border-b border-slate-100 bg-slate-50/70">
          <div className="grid grid-cols-3 gap-2">
            {(['Family', 'Travel', 'Business'] as Target[]).map(t => {
              const meta = TARGET_META[t];
              const Icon = meta.icon;
              const isActive = activeTarget === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setActiveTarget(t);
                    setSearchTerm('');
                    setIsAddingCategory(false);
                    setAddingSubcatFor(null);
                  }}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                    isActive
                      ? `${meta.badgeBg} ${meta.badgeBorder} border-2 shadow-sm scale-102`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate w-full text-center leading-tight">{meta.name}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-tabs: Entities vs Categories */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
            <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-bold">
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Categories & Subcategories ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('entities')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'entities' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {targetMeta.entityLabel}s ({entitiesForTarget.length})
              </button>
            </div>

            {activeTab === 'categories' && (
              <button
                onClick={handleResetTargetTaxonomy}
                className="text-[11px] font-semibold text-slate-400 hover:text-red-600 flex items-center gap-1"
                title="Reset to default factory taxonomy"
              >
                <RotateCcw className="w-3 h-3" /> Reset {activeTarget}
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* TAB 1: CATEGORIES & SUBCATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={`Search ${activeTarget} categories…`}
                    className="field pl-9 text-xs py-2"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Category
                </button>
                {deletedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDeleted(v => !v)}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1 ${
                      showDeleted ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    {showDeleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{deletedCount} hidden</span>
                  </button>
                )}
              </div>

              {/* Add category box */}
              {isAddingCategory && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
                  <p className="text-xs font-bold text-indigo-900">New Custom {activeTarget} Category</p>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Category name (e.g. AI Tools & Agents)"
                    className="field text-xs bg-white"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newCategorySubs}
                    onChange={e => setNewCategorySubs(e.target.value)}
                    placeholder="Subcategories (comma separated, e.g. Claude Pro, Cursor, ChatGPT)"
                    className="field text-xs bg-white"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              )}

              {/* Category Cards */}
              <div className="space-y-2">
                {filteredCategories.map(cat => {
                  const meta = getCategoryMeta(cat.name, activeTarget as ExpenseTarget);
                  const Icon = meta.icon || Tag;
                  const isExpanded = expandedCategories[cat.name] ?? true;
                  const isRenaming = editingCategoryName === cat.name;

                  return (
                    <div
                      key={cat.name}
                      className={`border rounded-xl transition-all ${
                        cat.isDeleted
                          ? 'bg-slate-100/60 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Category row header */}
                      <div className="flex items-center justify-between p-3 gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCategories(prev => ({ ...prev, [cat.name]: !isExpanded }))
                            }
                            className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>

                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${meta.color || '#6366f1'}1a` }}
                          >
                            <Icon className="w-3.5 h-3.5" style={{ color: meta.color || '#6366f1' }} />
                          </span>

                          {isRenaming ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                value={renameCategoryVal}
                                onChange={e => setRenameCategoryVal(e.target.value)}
                                className="field text-xs py-1"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleRenameCategory(cat.name)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryName(null)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="min-w-0 flex items-baseline gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">{cat.name}</span>
                              {cat.isCustom && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                                  Custom
                                </span>
                              )}
                              {cat.isDeleted && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded">
                                  Hidden
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!isRenaming && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryName(cat.name);
                                setRenameCategoryVal(cat.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                              title="Rename category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleHideCategory(cat.name, cat.isDeleted)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                cat.isDeleted
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={cat.isDeleted ? 'Unhide category' : 'Hide category'}
                            >
                              {cat.isDeleted ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Subcategories list */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 rounded-b-xl space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {cat.subcategories.map(sub => {
                              const isSubRenaming = editingSubcatKey === `${cat.name}::${sub.name}`;
                              return isSubRenaming ? (
                                <div key={sub.name} className="flex items-center gap-1 bg-white p-1 rounded-lg border">
                                  <input
                                    type="text"
                                    value={renameSubcatVal}
                                    onChange={e => setRenameSubcatVal(e.target.value)}
                                    className="field text-xs py-0.5 px-1.5 w-28"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRenameSubcategory(cat.name, sub.name)}
                                    className="p-1 text-emerald-600"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSubcatKey(null)}
                                    className="p-1 text-slate-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span
                                  key={sub.name}
                                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border ${
                                    sub.isDeleted
                                      ? 'bg-slate-200 text-slate-400 border-slate-300 line-through'
                                      : 'bg-white text-slate-700 border-slate-200 shadow-2xs'
                                  }`}
                                >
                                  <span>{sub.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSubcatKey(`${cat.name}::${sub.name}`);
                                      setRenameSubcatVal(sub.name);
                                    }}
                                    className="text-slate-400 hover:text-slate-600"
                                    title="Rename subcategory"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleHideSubcategory(cat.name, sub.name, sub.isDeleted)}
                                    className={sub.isDeleted ? 'text-emerald-600' : 'text-slate-400 hover:text-red-500'}
                                    title={sub.isDeleted ? 'Unhide' : 'Hide'}
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              );
                            })}

                            {addingSubcatFor === cat.name ? (
                              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border">
                                <input
                                  type="text"
                                  value={newSubcatName}
                                  onChange={e => setNewSubcatName(e.target.value)}
                                  placeholder="Subcategory name"
                                  className="field text-xs py-0.5 px-1.5 w-32"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddSubcategory(cat.name)}
                                  className="px-2 py-0.5 bg-indigo-600 text-white rounded text-xs font-bold"
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAddingSubcatFor(null)}
                                  className="p-1 text-slate-400"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingSubcatFor(cat.name);
                                  setNewSubcatName('');
                                }}
                                className="px-2 py-1 rounded-lg text-xs font-semibold text-indigo-600 border border-dashed border-indigo-200 hover:bg-indigo-50/60"
                              >
                                + Subcategory
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: REAL-WORLD TARGET ENTITIES (Trips, Offices, Family Members) */}
          {activeTab === 'entities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {targetMeta.name} {targetMeta.entityLabel}s
                  </h3>
                  <p className="text-xs text-slate-400">
                    Track real-world entities for {activeTarget} and attach expenses directly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenNewEntity}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add {targetMeta.entityLabel}
                </button>
              </div>

              {/* Entity Edit Form */}
              {isEntityFormOpen && (
                <form onSubmit={handleSaveEntityForm} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-slate-900">
                    {editingEntityId ? `Edit ${targetMeta.entityLabel}` : `New ${targetMeta.entityLabel}`}
                  </p>
                  <div>
                    <label className="field-label" htmlFor="entity-name">{targetMeta.entityLabel} Name / Identifier</label>
                    <input
                      id="entity-name"
                      type="text"
                      value={entityName}
                      onChange={e => setEntityName(e.target.value)}
                      placeholder={activeTarget === 'Travel' ? 'e.g. Summer in Italy' : activeTarget === 'Business' ? 'e.g. Consulting HQ' : 'e.g. Household Member'}
                      className="field text-xs bg-white"
                      required
                    />
                  </div>

                  {activeTarget === 'Travel' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="field-label" htmlFor="trip-start">Start Date</label>
                        <input
                          id="trip-start"
                          type="date"
                          value={entityDateStart}
                          onChange={e => setEntityDateStart(e.target.value)}
                          className="field text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="trip-end">End Date</label>
                        <input
                          id="trip-end"
                          type="date"
                          value={entityDateEnd}
                          onChange={e => setEntityDateEnd(e.target.value)}
                          className="field text-xs bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {activeTarget === 'Business' && (
                    <div>
                      <label className="field-label" htmlFor="office-type">Business Type / Industry</label>
                      <select
                        id="office-type"
                        value={entityType}
                        onChange={e => setEntityType(e.target.value)}
                        className="field text-xs bg-white"
                      >
                        <option value="General Workspace">General Business / Workspace</option>
                        <option value="Real Estate">Real Estate & Brokerage</option>
                        <option value="Consulting">Consulting & Professional Services</option>
                        <option value="Technology & Software">Technology & Software</option>
                        <option value="Healthcare & Medical">Healthcare & Medical</option>
                        <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                        <option value="Legal & Financial">Legal & Financial</option>
                        <option value="Home Office">Home Office</option>
                        <option value="Headquarters">Headquarters</option>
                        <option value="Branch">Branch</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Choosing &quot;Real Estate&quot; enables MLS dues, broker splits, and property staging subcategories.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="field-label" htmlFor="entity-notes">Notes</label>
                    <textarea
                      id="entity-notes"
                      rows={2}
                      value={entityNotes}
                      onChange={e => setEntityNotes(e.target.value)}
                      placeholder="Optional notes or details…"
                      className="field text-xs bg-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEntityFormOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
                    >
                      Save {targetMeta.entityLabel}
                    </button>
                  </div>
                </form>
              )}

              {/* Entity List */}
              {entitiesForTarget.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">No {targetMeta.entityLabel}s configured</p>
                  <p className="text-xs text-slate-400 mt-1">Add your first {targetMeta.entityLabel} to associate costs.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden">
                  {entitiesForTarget.map((ent: any) => {
                    const headline = ent.name || 'Unnamed';
                    const subtext = [ent.startDate && ent.endDate ? `${ent.startDate} → ${ent.endDate}` : ent.startDate, ent.officeType, ent.notes].filter(Boolean).join(' · ');

                    return (
                      <div key={ent.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">{headline}</p>
                          {subtext && <p className="text-xs text-slate-500 truncate mt-0.5">{subtext}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEntity(ent)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntityConfirm(ent.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
