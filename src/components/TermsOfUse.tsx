import React from 'react';
import { Shield, FileText, CheckCircle2, UserCheck, EyeOff } from 'lucide-react';
import { SiteSettings } from '../types';

interface TermsOfUseProps {
  settings: SiteSettings;
}

export function TermsOfUse({ settings }: TermsOfUseProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Info */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="p-3.5 rounded-full bg-[#FF2D8D]/10 text-[#FF2D8D] mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="font-display font-black text-3xl md:text-4xl text-gray-900 dark:text-white mb-2">Termos de Uso e Política de Privacidade</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
          Estes termos regulam a utilização do site RaviCar, serviços de consultas, simulações de financiamento e agendamentos de visitas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-2xl p-5 flex flex-col items-center text-center">
          <Shield className="w-6 h-6 text-[#FF2D8D] mb-3" />
          <h4 className="font-display font-bold text-gray-900 dark:text-white text-xs mb-1.5 uppercase tracking-wide">100% Protegido (LGPD)</h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
            Seus dados são armazenados de forma criptografada em nosso servidor local e jamais são comercializados ou compartilhados com terceiros sem consentimento.
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-2xl p-5 flex flex-col items-center text-center">
          <UserCheck className="w-6 h-6 text-[#FF6FB5] mb-3" />
          <h4 className="font-display font-bold text-gray-900 dark:text-white text-xs mb-1.5 uppercase tracking-wide">Análise Transparente</h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
            As simulações de financiamento são enviadas diretamente às mais de 13 financeiras credenciadas sob o respaldo de correspondentes bancários autorizados do Banco Central.
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-2xl p-5 flex flex-col items-center text-center">
          <EyeOff className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-3" />
          <h4 className="font-display font-bold text-gray-900 dark:text-white text-xs mb-1.5 uppercase tracking-wide">Direito de Exclusão</h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
            A qualquer momento, o usuário pode solicitar a exclusão integral do seu cadastro, de suas mensagens e de seus contatos de nossas bases de dados via e-mail ou WhatsApp.
          </p>
        </div>
      </div>

      {/* Main Terms text panels */}
      <div className="space-y-8 text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-2xl p-6 md:p-8">
        
        {/* Intro */}
        <div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white text-sm mb-3 border-b border-gray-200 dark:border-neutral-900 pb-2 uppercase tracking-wider text-[#FF2D8D]">
            1. Aceitação dos Termos
          </h2>
          <p className="mb-2">
            Bem-vindo ao site oficial da RaviCar Veículos LTDA (CNPJ {settings.pixCnpj}). Ao acessar, navegar ou submeter dados em nosso site, você manifesta seu consentimento inequívoco e integral com as presentes diretrizes de utilização e armazenamento de dados.
          </p>
          <p>
            Caso você discorde de qualquer cláusula contida neste termo, solicitamos que interrompa imediatamente o uso de nossos formulários de agendamento, simulação de parcelas e avaliações.
          </p>
        </div>

        {/* 2. LGPD & Dados Pessoais */}
        <div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white text-sm mb-3 border-b border-gray-200 dark:border-neutral-900 pb-2 uppercase tracking-wider text-[#FF2D8D]">
            2. LGPD - Política de Privacidade e Proteção de Dados
          </h2>
          <p className="mb-2">
            Em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/18), a RaviCar compromete-se com a segurança e a transparência na manipulação das informações pessoais dos usuários:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mb-3">
            <li><strong>Finalidade da Coleta:</strong> Os dados fornecidos nos formulários (como Nome, CPF, Telefone e Data de Nascimento) são coletados exclusivamente para fins de qualificação cadastral, contato prévio para agendamento de test-drive, avaliação física de seminovos e análise de risco para concessão de crédito veicular junto a bancos parceiros.</li>
            <li><strong>Minimização de Dados:</strong> Coletamos apenas as informações estritamente necessárias para dar andamento às solicitações comerciais iniciadas pelo próprio usuário.</li>
            <li><strong>Criptografia e Armazenamento:</strong> Todos os dados de leads, contatos e propostas são mantidos em banco de dados isolado no servidor, com controle rigoroso de acesso apenas por profissionais autorizados (Vendedores e Administradores).</li>
          </ul>
        </div>

        {/* 3. Simulação de Crédito */}
        <div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white text-sm mb-3 border-b border-gray-200 dark:border-neutral-900 pb-2 uppercase tracking-wider text-[#FF2D8D]">
            3. Simulações de Financiamento e Propostas de Crédito
          </h2>
          <p className="mb-2">
            A ferramenta de simulador de financiamento disponível no site constitui mera simulação preliminar e informativa. O envio da proposta não garante:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mb-2">
            <li>A aprovação automática do crédito, a qual fica sujeita aos critérios internos de análise de score, restrições cadastrais (SPC/Serasa) e políticas de crédito das instituições financeiras parceiras.</li>
            <li>A fixação de taxas de juros, que podem sofrer alterações sem aviso prévio de acordo com as oscilações de mercado e perfil de risco do proponente.</li>
          </ul>
        </div>

        {/* 4. Negociação e WhatsApp */}
        <div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white text-sm mb-3 border-b border-gray-200 dark:border-neutral-900 pb-2 uppercase tracking-wider text-[#FF2D8D]">
            4. Processo de Venda via WhatsApp
          </h2>
          <p className="mb-2">
            A conclusão de reservas de veículos, assinaturas de contratos de compra e venda, pagamentos de sinal (via PIX ou transferência) e entregas técnicas de chaves ocorrem de forma presencial no estabelecimento físico situado na {settings.address}, ou em atendimento digital individualizado direto com vendedores certificados da agência.
          </p>
          <p>
            O botão <strong>"Comprar pelo WhatsApp"</strong> atua como facilitador de comunicação rápida, enviando uma mensagem pré-formatada para os celulares corporativos da RaviCar, iniciando uma negociação consultiva humana em tempo real.
          </p>
        </div>

        {/* 5. Contato Encarregado */}
        <div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white text-sm mb-3 border-b border-gray-200 dark:border-neutral-900 pb-2 uppercase tracking-wider text-[#FF2D8D]">
            5. Canal de Atendimento ao Titular dos Dados (Encarregado DPO)
          </h2>
          <p>
            Para exercer seus direitos de titular (confirmação de existência de tratamento, acesso aos dados cadastrados, correção de informações incompletas, ou exclusão integral do cadastro), entre em contato direto pelo e-mail oficial: <span className="text-[#FF2D8D] font-semibold">{settings.email}</span> ou pelo telefone <span className="text-[#FF2D8D] font-semibold">{settings.phone}</span>. Responderemos em até 48 horas úteis.
          </p>
        </div>
      </div>
    </div>
  );
}
