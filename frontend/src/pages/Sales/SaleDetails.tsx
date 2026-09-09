import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../../services/api';
import InvoiceTemplateRenderer, { type InvoiceRenderData, type InvoiceTemplateData } from '../../components/invoice/InvoiceTemplateRenderer';

export default function SaleDetails() {
  const { id } = useParams();
  const paper = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<InvoiceTemplateData | null>(null);
  const [data, setData] = useState<InvoiceRenderData | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const selected = (await api.get('/invoice-templates/default')).data?.data;
        if (!selected?.id) throw new Error('No active invoice template is configured.');
        const response = await api.get(`/invoice-templates/${selected.id}/preview`, { params: { sale_id: id } });
        const payload = response.data?.data;
        setTemplate({ ...payload.template, config: { ...payload.template.config } });
        setData(payload as InvoiceRenderData);
      } catch (requestError: any) {
        setError(`Unable to load sale invoice${requestError?.response?.status ? ` (HTTP ${requestError.response.status})` : ''}: ${requestError?.response?.data?.message || requestError?.message || 'Request failed.'}`);
      }
    };
    void load();
  }, [id]);

  const download = async () => {
    if (!paper.current || !data) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(paper.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = 210;
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, width, height);
      pdf.save(`${data.sale.invoice_no}.pdf`);
    } catch (requestError) {
      console.error('Invoice PDF download failed', requestError);
      setError('Unable to download invoice PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (error) return <main className="p-6 text-red-600">{error}</main>;
  if (!template || !data) return <main className="p-6 text-slate-500">Loading invoice...</main>;

  return <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0"><div className="mx-auto mb-4 flex max-w-[794px] flex-wrap justify-end gap-2 print:hidden"><Link to="/sales" className="rounded border bg-white px-4 py-2 text-sm font-medium text-slate-700">Back</Link><Link to={`/sales/${id}/edit`} className="rounded border bg-white px-4 py-2 text-sm font-medium text-slate-700">Edit Sale</Link><button onClick={() => window.print()} className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Print</button><button onClick={() => void download()} disabled={downloading} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{downloading ? 'Preparing PDF...' : 'Download PDF'}</button></div><div ref={paper}><InvoiceTemplateRenderer template={template} data={data} /></div></main>;
}
