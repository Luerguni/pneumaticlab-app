import React from 'react';

interface SymbolProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const S = (props: SymbolProps & { children: React.ReactNode; viewBox?: string }) => (
  <svg
    width={props.size ?? 40}
    height={props.size ?? 40}
    viewBox={props.viewBox ?? '0 0 40 40'}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {props.children}
  </svg>
);

export const CompressorSymbol = ({ size = 40, color = '#00D4FF', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color}>
    <circle cx="20" cy="20" r="14" stroke={color} strokeWidth={strokeWidth} />
    <line x1="6" y1="20" x2="34" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <path d="M14 14 L20 26 L26 14" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <line x1="20" y1="6" x2="20" y2="10" stroke={color} strokeWidth={strokeWidth} />
    <line x1="20" y1="30" x2="20" y2="34" stroke={color} strokeWidth={strokeWidth} />
    <text x="20" y="38" textAnchor="middle" fill={color} fontSize="5" fontFamily="JetBrains Mono">C</text>
  </S>
);

export const CylinderDoubleSymbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color}>
    <rect x="4" y="12" width="28" height="16" stroke={color} strokeWidth={strokeWidth} />
    <line x1="16" y1="12" x2="16" y2="28" stroke={color} strokeWidth={strokeWidth} />
    <line x1="32" y1="20" x2="38" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="2" y1="20" x2="4" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="4" y1="14" x2="4" y2="26" stroke={color} strokeWidth={strokeWidth * 2} strokeLinecap="round" />
    <circle cx="35" cy="20" r="2" stroke={color} strokeWidth={strokeWidth} />
  </S>
);

export const CylinderSingleSymbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color}>
    <rect x="4" y="12" width="24" height="16" stroke={color} strokeWidth={strokeWidth} />
    <line x1="16" y1="12" x2="16" y2="28" stroke={color} strokeWidth={strokeWidth} />
    <line x1="28" y1="20" x2="36" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="4" y1="14" x2="4" y2="26" stroke={color} strokeWidth={strokeWidth * 2} strokeLinecap="round" />
    <path d="M24 13 Q28 13 28 20 Q28 27 24 27" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <line x1="24" y1="18" x2="30" y2="22" stroke={color} strokeWidth={strokeWidth} />
  </S>
);

export const Valve52Symbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color} viewBox="0 0 50 40">
    <rect x="5" y="10" width="40" height="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="15" y1="10" x2="15" y2="30" stroke={color} strokeWidth={strokeWidth} />
    <line x1="25" y1="10" x2="25" y2="30" stroke={color} strokeWidth={strokeWidth} />
    <line x1="35" y1="10" x2="35" y2="30" stroke={color} strokeWidth={strokeWidth} />
    <line x1="10" y1="30" x2="10" y2="36" stroke={color} strokeWidth={strokeWidth} />
    <line x1="20" y1="30" x2="20" y2="36" stroke={color} strokeWidth={strokeWidth} />
    <line x1="30" y1="30" x2="30" y2="36" stroke={color} strokeWidth={strokeWidth} />
    <line x1="40" y1="30" x2="40" y2="36" stroke={color} strokeWidth={strokeWidth} />
    <line x1="25" y1="4" x2="25" y2="10" stroke={color} strokeWidth={strokeWidth} />
    <path d="M20 4 L25 2 L30 4" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <circle cx="45" cy="15" r="3" stroke={color} strokeWidth={strokeWidth} />
    <path d="M5 22 L5 16 L3 18" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <text x="25" y="23" textAnchor="middle" fill={color} fontSize="6" fontFamily="JetBrains Mono">5/2</text>
  </S>
);

export const Valve32Symbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color} viewBox="0 0 40 40">
    <rect x="5" y="10" width="30" height="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="18" y1="10" x2="18" y2="30" stroke={color} strokeWidth={strokeWidth} />
    <line x1="12" y1="30" x2="12" y2="36" stroke={color} strokeWidth={strokeWidth} />
    <line x1="24" y1="30" x2="24" y2="36" stroke={color} strokeWidth={strokeWidth} />
    <line x1="20" y1="4" x2="20" y2="10" stroke={color} strokeWidth={strokeWidth} />
    <path d="M16 4 L20 2 L24 4" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <path d="M5 22 L5 16 L3 18" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <circle cx="35" cy="15" r="3" stroke={color} strokeWidth={strokeWidth} />
    <text x="20" y="23" textAnchor="middle" fill={color} fontSize="6" fontFamily="JetBrains Mono">3/2</text>
  </S>
);

export const Valve43Symbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color} viewBox="0 0 60 40">
    <rect x="5" y="10" width="50" height="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="22" y1="10" x2="22" y2="30" stroke={color} strokeWidth={strokeWidth} />
    <line x1="38" y1="10" x2="38" y2="30" stroke={color} strokeWidth={strokeWidth} />
    <line x1="13" y1="30" x2="13" y2="36" stroke={color} strokeWidth={strokeWidth} />
    <line x1="30" y1="30" x2="30" y2="36" stroke={color} strokeWidth={strokeWidth} />
    <line x1="47" y1="30" x2="47" y2="36" stroke={color} strokeWidth={strokeWidth} />
    <line x1="30" y1="4" x2="30" y2="10" stroke={color} strokeWidth={strokeWidth} />
    <path d="M26 4 L30 2 L34 4" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <circle cx="57" cy="15" r="3" stroke={color} strokeWidth={strokeWidth} />
    <path d="M5 22 L5 16 L3 18" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <text x="30" y="23" textAnchor="middle" fill={color} fontSize="5" fontFamily="JetBrains Mono">4/3</text>
  </S>
);

export const FRLSymbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color} viewBox="0 0 60 40">
    {/* Filter */}
    <rect x="2" y="8" width="16" height="24" stroke={color} strokeWidth={strokeWidth} />
    <path d="M6 12 L14 20 L6 28" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <ellipse cx="10" cy="30" rx="5" ry="3" stroke={color} strokeWidth={strokeWidth} />
    {/* Regulator */}
    <rect x="22" y="8" width="16" height="24" stroke={color} strokeWidth={strokeWidth} />
    <line x1="30" y1="8" x2="30" y2="14" stroke={color} strokeWidth={strokeWidth} />
    <line x1="26" y1="14" x2="34" y2="14" stroke={color} strokeWidth={strokeWidth} />
    <path d="M26 18 Q30 22 34 18" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <line x1="26" y1="22" x2="34" y2="22" stroke={color} strokeWidth={strokeWidth} strokeDasharray="2,2" />
    <line x1="30" y1="3" x2="30" y2="8" stroke={color} strokeWidth={strokeWidth} />
    <path d="M27 3 L33 3" stroke={color} strokeWidth={strokeWidth} />
    {/* Lubricator */}
    <rect x="42" y="8" width="16" height="24" stroke={color} strokeWidth={strokeWidth} />
    <ellipse cx="50" cy="24" rx="5" ry="7" stroke={color} strokeWidth={strokeWidth} />
    <path d="M48 16 L52 16 L50 12 Z" fill={color} />
    {/* connections */}
    <line x1="0" y1="20" x2="2" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="18" y1="20" x2="22" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="38" y1="20" x2="42" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="58" y1="20" x2="60" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <text x="30" y="38" textAnchor="middle" fill={color} fontSize="5" fontFamily="JetBrains Mono">FRL</text>
  </S>
);

export const PressureGaugeSymbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color}>
    <circle cx="20" cy="18" r="12" stroke={color} strokeWidth={strokeWidth} />
    <line x1="20" y1="6" x2="20" y2="10" stroke={color} strokeWidth={strokeWidth} />
    <line x1="28" y1="10" x2="25" y2="13" stroke={color} strokeWidth={strokeWidth} />
    <line x1="32" y1="18" x2="28" y2="18" stroke={color} strokeWidth={strokeWidth} />
    <path d="M20 18 L24 12" stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
    <circle cx="20" cy="18" r="1.5" fill={color} />
    <line x1="20" y1="30" x2="20" y2="34" stroke={color} strokeWidth={strokeWidth} />
    <text x="20" y="38" textAnchor="middle" fill={color} fontSize="5" fontFamily="JetBrains Mono">MAN</text>
  </S>
);

export const CheckValveSymbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color}>
    <line x1="2" y1="20" x2="38" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <polygon points="12,12 12,28 26,20" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <line x1="26" y1="12" x2="26" y2="28" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="32" cy="20" r="4" stroke={color} strokeWidth={strokeWidth} fill="none" />
  </S>
);

export const SilencerSymbol = ({ size = 40, color = '#7C8DB0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color}>
    <rect x="12" y="8" width="16" height="24" stroke={color} strokeWidth={strokeWidth} />
    <line x1="12" y1="12" x2="28" y2="12" stroke={color} strokeWidth={strokeWidth} />
    <line x1="12" y1="16" x2="28" y2="16" stroke={color} strokeWidth={strokeWidth} />
    <line x1="12" y1="20" x2="28" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="12" y1="24" x2="28" y2="24" stroke={color} strokeWidth={strokeWidth} />
    <line x1="20" y1="2" x2="20" y2="8" stroke={color} strokeWidth={strokeWidth} />
    <line x1="20" y1="32" x2="20" y2="38" stroke={color} strokeWidth={strokeWidth} />
  </S>
);

export const ReservoirSymbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color}>
    <rect x="4" y="8" width="32" height="24" rx="4" stroke={color} strokeWidth={strokeWidth} />
    <line x1="20" y1="2" x2="20" y2="8" stroke={color} strokeWidth={strokeWidth} />
    <line x1="20" y1="32" x2="20" y2="38" stroke={color} strokeWidth={strokeWidth} />
    <ellipse cx="20" cy="20" rx="8" ry="6" stroke={color} strokeWidth={strokeWidth} strokeDasharray="3,2" />
    <text x="20" y="24" textAnchor="middle" fill={color} fontSize="5" fontFamily="JetBrains Mono">ACC</text>
  </S>
);

export const FlowControlSymbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color}>
    <circle cx="20" cy="20" r="12" stroke={color} strokeWidth={strokeWidth} />
    <polygon points="14,14 26,14 20,26" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <line x1="8" y1="20" x2="14" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="26" y1="20" x2="32" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="14" y1="14" x2="26" y2="26" stroke={color} strokeWidth={strokeWidth} />
  </S>
);

export const MotorPneumaticSymbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color}>
    <circle cx="20" cy="20" r="14" stroke={color} strokeWidth={strokeWidth} />
    <text x="20" y="24" textAnchor="middle" fill={color} fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">M</text>
    <path d="M20 6 L18 10 L22 10 Z" fill={color} />
    <line x1="8" y1="20" x2="4" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="32" y1="20" x2="36" y2="20" stroke={color} strokeWidth={strokeWidth} />
  </S>
);

export const PressureSwitchSymbol = ({ size = 40, color = '#FF6B35', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color}>
    <circle cx="20" cy="16" r="10" stroke={color} strokeWidth={strokeWidth} />
    <line x1="20" y1="26" x2="20" y2="30" stroke={color} strokeWidth={strokeWidth} />
    <rect x="14" y="30" width="12" height="6" stroke={color} strokeWidth={strokeWidth} />
    <line x1="12" y1="33" x2="14" y2="33" stroke={color} strokeWidth={strokeWidth} />
    <line x1="26" y1="33" x2="28" y2="33" stroke={color} strokeWidth={strokeWidth} />
    <path d="M18 12 L20 20 L22 12" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <text x="20" y="18" textAnchor="middle" fill={color} fontSize="5" fontFamily="JetBrains Mono">P</text>
  </S>
);

export const TeeSymbol = ({ size = 40, color = '#E2E8F0', strokeWidth = 2 }: SymbolProps) => (
  <S size={size} color={color}>
    <line x1="2" y1="20" x2="38" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="20" y1="20" x2="20" y2="38" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="20" cy="20" r="3" fill={color} />
  </S>
);

export const PositionSensorSymbol = ({ size = 40, color = '#00FF9D', strokeWidth = 1.5 }: SymbolProps) => (
  <S size={size} color={color}>
    <rect x="8" y="10" width="24" height="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="14" y1="20" x2="26" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="20" y1="14" x2="20" y2="26" stroke={color} strokeWidth={strokeWidth} />
    <line x1="8" y1="20" x2="2" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <line x1="32" y1="20" x2="38" y2="20" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="20" cy="20" r="2" fill={color} />
    <text x="20" y="36" textAnchor="middle" fill={color} fontSize="5" fontFamily="JetBrains Mono">SEN</text>
  </S>
);

export const SYMBOL_COMPONENTS: Record<string, React.ComponentType<SymbolProps>> = {
  compressor: CompressorSymbol,
  frl: FRLSymbol,
  valve_5_2: Valve52Symbol,
  valve_3_2: Valve32Symbol,
  valve_4_3: Valve43Symbol,
  cylinder_double: CylinderDoubleSymbol,
  cylinder_single: CylinderSingleSymbol,
  motor_pneumatic: MotorPneumaticSymbol,
  silencer: SilencerSymbol,
  reservoir: ReservoirSymbol,
  pressure_gauge: PressureGaugeSymbol,
  pressure_switch: PressureSwitchSymbol,
  tee: TeeSymbol,
  position_sensor: PositionSensorSymbol,
  check_valve: CheckValveSymbol,
  flow_control: FlowControlSymbol,
};

export const SYMBOL_LABELS: Record<string, string> = {
  compressor: 'Compresor',
  frl: 'FRL Completo',
  filter: 'Filtro',
  regulator: 'Regulador',
  lubricator: 'Lubricador',
  valve_2_2: 'Válvula 2/2',
  valve_3_2: 'Válvula 3/2',
  valve_4_2: 'Válvula 4/2',
  valve_4_3: 'Válvula 4/3',
  valve_5_2: 'Válvula 5/2',
  valve_5_3: 'Válvula 5/3',
  cylinder_single: 'Cilindro Simple',
  cylinder_double: 'Cilindro Doble',
  cylinder_telescopic: 'Telescópico',
  motor_pneumatic: 'Motor Neumático',
  silencer: 'Silenciador',
  reservoir: 'Acumulador',
  pressure_gauge: 'Manómetro',
  pressure_switch: 'Presostato',
  tee: 'Unión T',
  elbow: 'Codo',
  cross: 'Cruz',
  position_sensor: 'Sensor Posición',
  flow_control: 'Caudal Regulable',
  check_valve: 'Anti-retorno',
};
