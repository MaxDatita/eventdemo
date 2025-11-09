import { theme } from '@/config/theme';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDemoDates } from '@/contexts/DemoContext';



interface StyledDialogProps {
  title: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preventCloseWhenChildrenOpen?: boolean;
}

export const StyledDialog = ({ 
  title, 
  children, 
  trigger,
  open,
  onOpenChange,
  preventCloseWhenChildrenOpen = false,
}: StyledDialogProps) => {
  const { isDarkMode } = useDemoDates();
  
  const handleOpenChange = (newOpen: boolean) => {
    // Si preventCloseWhenChildrenOpen está activo y hay modales hijos abiertos, no cerrar
    if (preventCloseWhenChildrenOpen && !newOpen && open) {
      // Permitir cerrar solo si no hay modales hijos activos
      // Esta lógica se manejará desde el componente padre
    }
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onOpenChange={handleOpenChange}
      modal={true}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent 
        className={`sm:max-w-[425px] ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}
        onInteractOutside={(e) => {
          if (preventCloseWhenChildrenOpen) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (preventCloseWhenChildrenOpen) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onPointerDownOutside={(e) => {
          if (preventCloseWhenChildrenOpen) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className={`text-base ${isDarkMode ? 'text-white' : ''}`}>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};