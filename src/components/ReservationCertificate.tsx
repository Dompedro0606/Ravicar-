import React, { useState } from 'react';
import { Lock, ShieldCheck, Copy, Check, Building2, Smartphone, Mail, CreditCard, CheckCircle2 } from 'lucide-react';

export function ReservationCertificate() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-[#18181B] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Security Header */}
      <div className="bg-[#18181B] border-b border-neutral-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Lock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-display font-bold text-lg">Certificado de Reserva e Sinal</h2>
            <p className="text-emerald-400 text-sm font-medium flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
              Transação 100% Segura & Garantida
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-800">
          <CheckCircle2 className="w-4 h-4 text-[var(--brand-color)]" />
          <span className="text-xs text-gray-300 font-mono tracking-wide">RAVICAR VEÍCULOS LTDA</span>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-10">
        {/* PIX Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-color)]/10 flex items-center justify-center border border-[var(--brand-color)]/20">
              <span className="text-[var(--brand-color)] font-bold">PIX</span>
            </div>
            <h3 className="text-white font-display font-bold text-lg">Pagamento via PIX</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'cnpj', label: 'Chave CNPJ', value: '00.000.000/0001-00', icon: Building2 },
              { id: 'cel', label: 'Chave Celular', value: '(11) 99999-9999', icon: Smartphone },
              { id: 'email', label: 'Chave E-mail', value: 'pagamentos@ravicar.com.br', icon: Mail }
            ].map((pix) => (
              <div key={pix.id} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 flex flex-col justify-between group hover:border-neutral-700 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <pix.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">{pix.label}</span>
                </div>
                <div className="text-white font-medium text-sm truncate mb-4">
                  {pix.value}
                </div>
                <button
                  onClick={() => handleCopy(pix.value, pix.id)}
                  className={`w-full py-2.5 rounded text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${
                    copiedKey === pix.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                  }`}
                >
                  {copiedKey === pix.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Chave
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Bank Accounts Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center border border-neutral-700">
              <CreditCard className="w-4 h-4 text-gray-300" />
            </div>
            <h3 className="text-white font-display font-bold text-lg">Transferência Direta (TED/DOC)</h3>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-gray-400 uppercase bg-neutral-900/80 border-b border-neutral-800 font-mono">
                <tr>
                  <th className="px-6 py-4 font-medium">Banco</th>
                  <th className="px-6 py-4 font-medium">Agência</th>
                  <th className="px-6 py-4 font-medium">Conta Corrente</th>
                  <th className="px-6 py-4 font-medium">Favorecido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-gray-300">
                <tr className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#CC0000]"></div>
                    Santander (033)
                  </td>
                  <td className="px-6 py-4 font-mono">1234</td>
                  <td className="px-6 py-4 font-mono">1234567-8</td>
                  <td className="px-6 py-4 text-xs">RAVICAR VEICULOS LTDA</td>
                </tr>
                <tr className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#CC092F]"></div>
                    Bradesco (237)
                  </td>
                  <td className="px-6 py-4 font-mono">4321</td>
                  <td className="px-6 py-4 font-mono">7654321-0</td>
                  <td className="px-6 py-4 text-xs">RAVICAR VEICULOS LTDA</td>
                </tr>
                <tr className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#EC7000]"></div>
                    Itaú (341)
                  </td>
                  <td className="px-6 py-4 font-mono">9876</td>
                  <td className="px-6 py-4 font-mono">12345-6</td>
                  <td className="px-6 py-4 text-xs">RAVICAR VEICULOS LTDA</td>
                </tr>
                <tr className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#FF7A00]"></div>
                    Banco Inter (077)
                  </td>
                  <td className="px-6 py-4 font-mono">0001</td>
                  <td className="px-6 py-4 font-mono">9876543-2</td>
                  <td className="px-6 py-4 text-xs">RAVICAR VEICULOS LTDA</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer Note */}
        <div className="bg-neutral-900/30 rounded-lg p-4 border border-neutral-800 flex items-start gap-3">
          <div className="mt-0.5">
            <Lock className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Ao realizar o pagamento do sinal, sua reserva estará garantida. Envie o comprovante para seu consultor através do WhatsApp oficial da loja. Certifique-se de que o favorecido na hora do pagamento seja <span className="text-white font-medium">RAVICAR VEICULOS LTDA - CNPJ: 00.000.000/0001-00</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
