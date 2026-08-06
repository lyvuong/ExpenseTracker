import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  CreditCard,
  Banknote,
  Gift,
  Building2,
  Wallet,
  Lock,
  UserCheck
} from 'lucide-react';
import type { PaymentTypeItem } from '../../types';

interface PaymentTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentTypes: PaymentTypeItem[];
  currentUserUid?: string;
  currentUserName?: string;
  onAddPaymentType: (name: string) => void;
  onUpdatePaymentType: (id: string, name: string) => void;
  onDeletePaymentType: (id: string) => void;
}

const getPaymentIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('cash')) return Banknote;
  if (lower.includes('gift')) return Gift;
  if (lower.includes('bank') || lower.includes('transfer') || lower.includes('check')) return Building2;
  if (lower.includes('visa') || lower.includes('mastercard') || lower.includes('card') || lower.includes('amex')) return CreditCard;
  return Wallet;
};

export const PaymentTypesModal: React.FC<PaymentTypesModalProps> = ({
  isOpen,
  onClose,
  paymentTypes,
  currentUserUid,
  currentUserName = 'Household Member',
  onAddPaymentType,
  onUpdatePaymentType,
  onDeletePaymentType
}) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  // Separate Cash from custom payment methods
  const hasCashInList = paymentTypes.some(p => p.name.toLowerCase() === 'cash' || p.isSystemDefault);
  const cashItem: PaymentTypeItem = hasCashInList
    ? (paymentTypes.find(p => p.name.toLowerCase() === 'cash' || p.isSystemDefault)!)
    : { id: 'pt-system-cash', name: 'Cash', isSystemDefault: true };

  const customPaymentTypes = paymentTypes.filter(p => p.id !== cashItem.id && p.name.toLowerCase() !== 'cash');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) return;
    if (clean.toLowerCase() === 'cash') {
      alert('"Cash" is already available to all members by default.');
      return;
    }
    onAddPaymentType(clean);
    setNewName('');
  };

  const startEdit = (item: PaymentTypeItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const saveEdit = (id: string) => {
    const clean = editingName.trim();
    if (clean) {
      onUpdatePaymentType(id, clean);
    }
    setEditingId(null);
    setEditingName('');
  };

  const isItemEditable = (item: PaymentTypeItem) => {
    if (item.isSystemDefault || item.name.toLowerCase() === 'cash') return false;
    if (currentUserUid && item.ownerUid) {
      return item.ownerUid === currentUserUid;
    }
    if (item.ownerName) {
      return item.ownerName.toLowerCase() === currentUserName.toLowerCase();
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Manage My Payment Methods</h2>
            <p className="text-xs text-slate-500">Each household member manages their own set of payment types</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Add form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={`Add card/method for ${currentUserName}...`}
              className="field flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Method
            </button>
          </form>

          {/* List */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              System Payment Method (All Members)
            </p>

            {/* Always-available Cash row */}
            <div className="flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-100/80 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Cash</span>
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Always available to all household members
                  </span>
                </div>
              </div>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" /> System Default
              </span>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 pt-2">
              Custom Payment Methods ({customPaymentTypes.length})
            </p>

            {customPaymentTypes.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-3 text-center border border-dashed border-slate-200 rounded-xl">
                No custom payment methods added yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {customPaymentTypes.map(item => {
                  const IconComponent = getPaymentIcon(item.name);
                  const isEditing = editingId === item.id;
                  const canEdit = isItemEditable(item);
                  const ownerDisplay = item.ownerName || currentUserName;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>

                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEdit(item.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="field py-1 text-sm flex-1"
                          />
                        ) : (
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-slate-800 truncate block">{item.name}</span>
                            <span className="text-[11px] text-slate-400 truncate block">Owner: {ownerDisplay}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isEditing ? (
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : canEdit ? (
                          <>
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remove payment method "${item.name}"?`)) {
                                  onDeletePaymentType(item.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-1 rounded-md" title="Managed by owner">
                            Managed by {ownerDisplay}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
