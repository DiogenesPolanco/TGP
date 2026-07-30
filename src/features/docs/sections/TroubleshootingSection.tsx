import {
  PageH1,
  Divider,
  BulletListInline,
  StepList,
  DebugCode,
  TroubleBlock,
  TroubleSection,
} from '../components/DocComponents'
import { troubleshootingData } from '@/features/docs/constants/troubleshootingData'

export function TroubleshootingSection() {
  return (
    <section id="troubleshooting" className="mb-20 scroll-mt-20">
      <PageH1>Troubleshooting</PageH1>
      <Divider />

      {troubleshootingData.slice(0, 5).map((entry, i) => (
        <TroubleBlock key={i} q={entry.question}>
          <TroubleSection label="Síntomas">
            <BulletListInline items={entry.symptoms} />
          </TroubleSection>
          {entry.diagnosis && (
            <TroubleSection label="Diagnóstico">
              <StepList items={entry.diagnosis} />
            </TroubleSection>
          )}
          {entry.causas && (
            <TroubleSection label="Causas comunes">
              <BulletListInline items={entry.causas} />
            </TroubleSection>
          )}
          {entry.rules && (
            <TroubleSection label={entry.rulesLabel ?? 'Reglas de validación'}>
              <BulletListInline items={entry.rules} />
            </TroubleSection>
          )}
          <TroubleSection label="Solución paso a paso">
            <StepList items={entry.solution} />
          </TroubleSection>
          {entry.debug && (
            <TroubleSection label="Debug">
              <DebugCode code={entry.debug} />
            </TroubleSection>
          )}
        </TroubleBlock>
      ))}

      {/* Separator: Errores por funcionalidad */}
      <div
        className="font-mono text-[10px] uppercase tracking-widest mb-4 mt-8 px-3 py-1.5 rounded-sm inline-block"
        style={{
          background: 'rgba(0,255,136,0.04)',
          color: '#4a5568',
          border: '1px solid rgba(0,255,136,0.06)',
        }}
      >
        Errores por funcionalidad
      </div>

      {troubleshootingData.slice(5).map((entry, i) => (
        <TroubleBlock key={i} q={entry.question} last={entry.last}>
          <TroubleSection label="Síntomas">
            <BulletListInline items={entry.symptoms} />
          </TroubleSection>
          {entry.diagnosis && (
            <TroubleSection label="Diagnóstico">
              <StepList items={entry.diagnosis} />
            </TroubleSection>
          )}
          {entry.causas && (
            <TroubleSection label="Causas comunes">
              <BulletListInline items={entry.causas} />
            </TroubleSection>
          )}
          {entry.rules && (
            <TroubleSection label={entry.rulesLabel ?? 'Reglas de validación'}>
              <BulletListInline items={entry.rules} />
            </TroubleSection>
          )}
          <TroubleSection label="Solución paso a paso">
            <StepList items={entry.solution} />
          </TroubleSection>
          {entry.debug && (
            <TroubleSection label="Debug">
              <DebugCode code={entry.debug} />
            </TroubleSection>
          )}
        </TroubleBlock>
      ))}
    </section>
  )
}
