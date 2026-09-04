import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children
}) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-sm cursor-pointer" 
        onClick={onClose} 
      />

      {/* Dialog container */}
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-[#09090b] text-foreground glass-panel shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border/50">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-white/5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
