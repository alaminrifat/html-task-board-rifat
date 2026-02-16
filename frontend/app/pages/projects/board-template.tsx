import { useState } from 'react';

import { useNavigate } from 'react-router';
import {
  Grid2x2,
  Search,
  Settings,
  CheckCircle,
  ArrowRight,
  GripVertical,
  Trash2,
  Plus,
  PlusCircle,
  Info,
} from 'lucide-react';

import MobileHeader from '~/components/layout/mobile-header';
import { cn } from '~/lib/utils';

type TemplateType = 'default' | 'minimal' | 'custom';

const COL_COLORS = [
  '#F1F5F9',
  '#FEF3C7',
  '#EDE9FE',
  '#D1FAE5',
  '#FCE7F3',
  '#FEE2E2',
  '#E0F2FE',
  '#FEF9C3',
];

const COL_BORDERS = [
  '#E2E8F0',
  '#FDE68A',
  '#DDD6FE',
  '#A7F3D0',
  '#FBCFE8',
  '#FECACA',
  '#BAE6FD',
  '#FDE047',
];

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Review', 'Done'];
const MINIMAL_COLUMNS = ['To Do', 'Done'];

export default function BoardTemplate() {
  const navigate = useNavigate();

  const [selected, setSelected] = useState<TemplateType>('default');
  const [customColumns, setCustomColumns] = useState<string[]>(['To Do', 'Done']);

  const handleSelectTemplate = (tpl: TemplateType) => {
    setSelected(tpl);
  };

  const handleAddColumn = () => {
    if ((customColumns ?? []).length >= 8) return;
    setCustomColumns((prev) => [...(prev ?? []), 'New Column']);
  };

  const handleRemoveColumn = (index: number) => {
    if ((customColumns ?? []).length <= 2) return;
    setCustomColumns((prev) => (prev ?? []).filter((_, i) => i !== index));
  };

  const handleColumnNameChange = (index: number, name: string) => {
    setCustomColumns((prev) => {
      const next = [...(prev ?? [])];
      next[index] = name;
      return next;
    });
  };

  const handleSelectClick = () => {
    navigate(-1);
  };

  const previewColumns =
    selected === 'default'
      ? DEFAULT_COLUMNS
      : selected === 'minimal'
        ? MINIMAL_COLUMNS
        : customColumns;

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Header */}
      <MobileHeader
        title="Board Template"
        onBack={() => navigate(-1)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 max-w-[600px] mx-auto">
          {/* Subtitle */}
          <p className="text-sm text-[#64748B] mb-6">
            Choose a template to set up your board columns. You can customize
            columns later in Board Settings.
          </p>

          {/* Template Cards */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Default Template */}
            <TemplateCard
              selected={selected === 'default'}
              onClick={() => handleSelectTemplate('default')}
              icon={<Grid2x2 className="h-5 w-5" />}
              iconBg="bg-[#4A90D9] text-white"
              title="Default"
              description="Full workflow with review stage"
            >
              <DefaultPreviewInline />
            </TemplateCard>

            {/* Minimal Template */}
            <TemplateCard
              selected={selected === 'minimal'}
              onClick={() => handleSelectTemplate('minimal')}
              icon={<Search className="h-5 w-5" />}
              iconBg="bg-[#F1F5F9] text-[#64748B]"
              title="Minimal"
              description="Simple two-column workflow"
            >
              <MinimalPreviewInline />
            </TemplateCard>

            {/* Custom Template */}
            <TemplateCard
              selected={selected === 'custom'}
              onClick={() => handleSelectTemplate('custom')}
              icon={<Settings className="h-5 w-5" />}
              iconBg="bg-[#F1F5F9] text-[#64748B]"
              title="Custom"
              description="Create your own columns"
            >
              {selected === 'custom' ? null : (
                <div className="flex items-center gap-2 text-[#94A3B8] justify-center py-3 border border-dashed border-[#CBD5E1] rounded-[6px] bg-[#F9FAFB]">
                  <PlusCircle className="h-5 w-5" />
                  <span className="text-xs font-medium">Define your columns</span>
                </div>
              )}
            </TemplateCard>
          </div>

          {/* Custom Columns Editor */}
          {selected === 'custom' ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#1E293B]">
                  Custom Columns
                </h4>
                <span className="text-[11px] text-[#64748B]">
                  {(customColumns ?? []).length} column
                  {(customColumns ?? []).length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Column List */}
              <div className="flex flex-col gap-2 mb-3">
                {(customColumns ?? []).map((col, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <div className="w-6 h-6 flex items-center justify-center text-[#94A3B8] cursor-grab">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex-1 flex items-center gap-2 h-[44px] px-3 bg-white border border-[#E5E7EB] rounded-[6px] focus-within:border-[#4A90D9] transition-colors">
                      <input
                        type="text"
                        value={col}
                        onChange={(e) =>
                          handleColumnNameChange(index, e.target.value)
                        }
                        className="flex-1 text-sm outline-none bg-transparent"
                        placeholder="Column name"
                      />
                      <button
                        type="button"
                        className="text-[11px] text-[#94A3B8] hover:text-[#4A90D9] whitespace-nowrap"
                      >
                        + WIP
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(index)}
                      disabled={(customColumns ?? []).length <= 2}
                      className={cn(
                        'p-1 transition-colors',
                        (customColumns ?? []).length <= 2
                          ? 'text-[#E5E7EB] cursor-not-allowed'
                          : 'text-[#CBD5E1] hover:text-[#EF4444]'
                      )}
                      aria-label={`Remove column ${col}`}
                    >
                      <Trash2 className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Column Button */}
              <button
                type="button"
                onClick={handleAddColumn}
                disabled={(customColumns ?? []).length >= 8}
                className={cn(
                  'w-full h-[44px] border border-dashed border-[#CBD5E1] rounded-[6px] bg-[#F9FAFB]',
                  'text-[#64748B] font-medium text-sm flex items-center justify-center gap-2',
                  'hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Plus className="h-[18px] w-[18px]" />
                Add Column
              </button>

              {/* WIP Hint */}
              <p className="text-[11px] text-[#94A3B8] mt-3 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Tap &quot;+ WIP&quot; to set a Work In Progress limit for a
                column.
              </p>
            </div>
          ) : null}

          {/* Preview Section */}
          <div className="mb-[100px]">
            <h4 className="text-sm font-semibold text-[#1E293B] mb-3">
              Preview
            </h4>
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 overflow-x-auto hide-scrollbar">
              <div
                className={cn(
                  'flex gap-2.5',
                  selected === 'minimal' ? 'justify-center' : 'min-w-max'
                )}
              >
                {(previewColumns ?? []).map((colName, index) => {
                  const bgColor =
                    COL_COLORS[index % COL_COLORS.length];
                  const borderColor =
                    COL_BORDERS[index % COL_BORDERS.length];
                  const cardCount = Math.max(1, 3 - index);

                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex flex-col gap-1.5',
                        selected === 'minimal' ? 'w-[120px]' : 'w-[80px]'
                      )}
                    >
                      <div className="text-[10px] font-semibold text-[#1E293B] text-center mb-1 truncate">
                        {colName || 'Untitled'}
                      </div>
                      <div
                        className="h-[60px] rounded-[6px] p-1.5 flex flex-col gap-1"
                        style={{
                          background: bgColor,
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        {Array.from({ length: cardCount }).map((_, ci) => (
                          <div
                            key={ci}
                            className="h-2 bg-white rounded-sm"
                            style={{ borderColor, border: `1px solid ${borderColor}` }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom */}
      <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] p-4 z-30">
        <button
          type="button"
          onClick={handleSelectClick}
          className={cn(
            'w-full h-[48px] bg-[#4A90D9] text-white font-semibold rounded-[6px]',
            'flex items-center justify-center shadow-sm',
            'hover:bg-[#3B82F6] active:scale-[0.98] transition-all'
          )}
        >
          Select Template
        </button>
      </div>
    </div>
  );
}

/* ---------- Template Card Component ---------- */

interface TemplateCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

function TemplateCard({
  selected,
  onClick,
  icon,
  iconBg,
  title,
  description,
  children,
}: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full rounded-[12px] p-4 text-left transition-all border-[2px]',
        selected
          ? 'bg-[#F0F7FF] border-[#4A90D9]'
          : 'bg-white border-[#E5E7EB] hover:border-[#94A3B8]'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              selected ? 'bg-[#4A90D9] text-white' : iconBg
            )}
          >
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#1E293B]">{title}</h4>
            <p className="text-[11px] text-[#64748B]">{description}</p>
          </div>
        </div>
        {selected ? (
          <div className="text-[#4A90D9]">
            <CheckCircle className="h-6 w-6" />
          </div>
        ) : null}
      </div>

      {/* Content / Preview */}
      {children}
    </button>
  );
}

/* ---------- Inline Previews for Template Cards ---------- */

function DefaultPreviewInline() {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 bg-white border border-[#BFDBFE] rounded-[6px] p-2 flex flex-col items-center gap-1">
        <div className="w-full h-1 bg-[#94A3B8] rounded-full opacity-40" />
        <div className="w-full h-5 bg-[#F1F5F9] rounded-[3px]" />
        <div className="w-full h-5 bg-[#F1F5F9] rounded-[3px]" />
        <span className="text-[10px] font-medium text-[#64748B] mt-0.5">
          To Do
        </span>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-[#4A90D9] shrink-0" />
      <div className="flex-1 bg-white border border-[#BFDBFE] rounded-[6px] p-2 flex flex-col items-center gap-1">
        <div className="w-full h-1 bg-[#F59E0B] rounded-full opacity-60" />
        <div className="w-full h-5 bg-[#FEF3C7] rounded-[3px]" />
        <div className="w-full h-5 bg-[#FEF3C7] rounded-[3px]" />
        <span className="text-[10px] font-medium text-[#64748B] mt-0.5">
          In Progress
        </span>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-[#4A90D9] shrink-0" />
      <div className="flex-1 bg-white border border-[#BFDBFE] rounded-[6px] p-2 flex flex-col items-center gap-1">
        <div className="w-full h-1 bg-[#8B5CF6] rounded-full opacity-60" />
        <div className="w-full h-5 bg-[#EDE9FE] rounded-[3px]" />
        <span className="text-[10px] font-medium text-[#64748B] mt-0.5">
          Review
        </span>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-[#4A90D9] shrink-0" />
      <div className="flex-1 bg-white border border-[#BFDBFE] rounded-[6px] p-2 flex flex-col items-center gap-1">
        <div className="w-full h-1 bg-[#10B981] rounded-full opacity-60" />
        <div className="w-full h-5 bg-[#D1FAE5] rounded-[3px]" />
        <span className="text-[10px] font-medium text-[#64748B] mt-0.5">
          Done
        </span>
      </div>
    </div>
  );
}

function MinimalPreviewInline() {
  return (
    <div className="flex items-center gap-2 w-full px-4">
      <div className="flex-1 bg-[#F9FAFB] border border-[#E2E8F0] rounded-[6px] p-2.5 flex flex-col items-center gap-1">
        <div className="w-full h-1 bg-[#94A3B8] rounded-full opacity-40" />
        <div className="w-full h-5 bg-[#F1F5F9] rounded-[3px]" />
        <div className="w-full h-5 bg-[#F1F5F9] rounded-[3px]" />
        <div className="w-full h-5 bg-[#F1F5F9] rounded-[3px]" />
        <span className="text-[10px] font-medium text-[#64748B] mt-0.5">
          To Do
        </span>
      </div>
      <ArrowRight className="h-4 w-4 text-[#94A3B8] shrink-0" />
      <div className="flex-1 bg-[#F9FAFB] border border-[#E2E8F0] rounded-[6px] p-2.5 flex flex-col items-center gap-1">
        <div className="w-full h-1 bg-[#10B981] rounded-full opacity-60" />
        <div className="w-full h-5 bg-[#D1FAE5] rounded-[3px]" />
        <span className="text-[10px] font-medium text-[#64748B] mt-0.5">
          Done
        </span>
      </div>
    </div>
  );
}
