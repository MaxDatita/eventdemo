'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useDemoDates } from '@/contexts/DemoContext'
import { toast } from 'sonner'
import { FileText, Download, Copy } from 'lucide-react'

interface ExportSummaryModalProps {
  open: boolean
  onClose: () => void
}

export function ExportSummaryModal({
  open,
  onClose,
}: ExportSummaryModalProps) {
  const { isDarkMode } = useDemoDates()
  const [isExporting, setIsExporting] = useState(false)
  const [exportedContent, setExportedContent] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<'text' | 'pdf' | null>(null)

  const handleExport = async (format: 'text' | 'pdf') => {
    setIsExporting(true)
    setExportFormat(format)

    try {
      const response = await fetch('/api/dashboard/export-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'admin123',
          format,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        if (format === 'text') {
          setExportedContent(result.content)
        } else {
          // Para PDF, generar el PDF en el cliente
          const { jsPDF } = await import('jspdf')
          const doc = new jsPDF()

          // Título
          doc.setFontSize(18)
          doc.text('RESUMEN DEL EVENTO', 105, 20, { align: 'center' })

          // Estadísticas
          let y = 35
          doc.setFontSize(12)
          doc.text(
            `Total de invitados confirmados: ${result.data.stats.totalGuests}`,
            20,
            y
          )
          y += 10
          doc.text(
            `Total de acompañantes: ${result.data.stats.totalCompanions}`,
            20,
            y
          )
          y += 10
          doc.text(
            `Total de personas: ${
              result.data.stats.totalGuests + result.data.stats.totalCompanions
            }`,
            20,
            y
          )
          y += 10
          doc.text(
            `Invitados con requerimientos alimentarios: ${result.data.stats.guestsWithDietaryRequirements}`,
            20,
            y
          )
          y += 15

          // Requerimientos alimentarios
          if (
            Object.keys(result.data.stats.dietaryRequirementsBreakdown).length > 0
          ) {
            doc.setFontSize(14)
            doc.text('REQUERIMIENTOS ALIMENTARIOS', 20, y)
            y += 10
            doc.setFontSize(10)
            Object.entries(result.data.stats.dietaryRequirementsBreakdown).forEach(
              ([req, count]) => {
                doc.text(`- ${req}: ${count} invitado(s)`, 25, y)
                y += 8
              }
            )
            y += 5
          }

          // Lista de invitados
          doc.setFontSize(14)
          doc.text('LISTA DE INVITADOS', 20, y)
          y += 10
          doc.setFontSize(10)
          result.data.guests.forEach((guest: any, index: number) => {
            let text = `${index + 1}. ${guest.firstName} ${guest.lastName}`
            if (guest.companions > 0) {
              text += ` (+${guest.companions} acompañante${
                guest.companions > 1 ? 's' : ''
              })`
            }
            if (guest.dietaryRequirements) {
              text += ` - ${guest.dietaryRequirements}`
            }

            // Verificar si el texto cabe en la página
            if (y > 270) {
              doc.addPage()
              y = 20
            }

            doc.text(text, 20, y)
            y += 8
          })

          // Descargar PDF
          doc.save('resumen-evento.pdf')
          toast.success('PDF generado y descargado')
          onClose()
        }
      } else {
        toast.error(result.error || 'Error al exportar resumen')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al exportar resumen')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyText = () => {
    if (exportedContent) {
      navigator.clipboard.writeText(exportedContent)
      toast.success('Texto copiado al portapapeles')
    }
  }

  const handleDownloadText = () => {
    if (exportedContent) {
      const blob = new Blob([exportedContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resumen-evento.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Archivo de texto descargado')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'
        } max-w-2xl`}
      >
        <DialogHeader>
          <DialogTitle>Exportar Resumen del Evento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!exportedContent ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => handleExport('text')}
                disabled={isExporting}
                className="flex flex-col items-center gap-2 h-auto py-6"
                variant={isDarkMode ? 'secondary' : 'default'}
              >
                <FileText className="h-8 w-8" />
                <span>Exportar como Texto</span>
                <span className="text-xs opacity-70">
                  Para copiar/pegar en email o WhatsApp
                </span>
              </Button>

              <Button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="flex flex-col items-center gap-2 h-auto py-6"
                variant={isDarkMode ? 'secondary' : 'default'}
              >
                <Download className="h-8 w-8" />
                <span>Exportar como PDF</span>
                <span className="text-xs opacity-70">
                  Documento profesional para compartir
                </span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg max-h-96 overflow-y-auto ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}
              >
                <pre
                  className={`whitespace-pre-wrap text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {exportedContent}
                </pre>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopyText}
                  variant="secondary"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Texto
                </Button>
                <Button
                  onClick={handleDownloadText}
                  variant="secondary"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar TXT
                </Button>
              </div>
            </div>
          )}

          {isExporting && (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Generando {exportFormat === 'pdf' ? 'PDF' : 'texto'}...
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setExportedContent(null)
              setExportFormat(null)
              onClose()
            }}
          >
            {exportedContent ? 'Cerrar' : 'Cancelar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



