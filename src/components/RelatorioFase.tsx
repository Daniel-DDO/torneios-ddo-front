import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface PartidaPdf {
  mandanteClube: string;
  mandanteJogador: string;
  visitanteClube: string;
  visitanteJogador: string;
  golsMandante: number;
  golsVisitante: number;
  estadio: string;
  realizada: boolean;
}

interface RelatorioFaseDTO {
  torneioNome: string;
  faseNome: string;
  classificacao: any[];
  rodadas: { numero: number; partidas: PartidaPdf[] }[];
  agendaJogadores: { identificador: string; partidas: PartidaPdf[] }[];
}

const styles = StyleSheet.create({
  page: {
    padding: 35,
    backgroundColor: '#020617',
    color: '#f8fafc',
    fontFamily: 'Helvetica',
  },
  header: {
    borderBottom: '2pt solid #3b82f6',
    paddingBottom: 10,
    marginBottom: 20,
  },
  torneioNome: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#3b82f6',
  },
  subHeader: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#3b82f6',
    textTransform: 'uppercase',
    textAlign: 'center',
    backgroundColor: '#0f172a',
    padding: 8,
    marginBottom: 20,
    border: '0.5pt solid #1e293b',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 6,
    borderBottom: '1pt solid #334155',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottom: '0.5pt solid #1e293b',
    alignItems: 'center',
  },
  colPos: { width: '8%', fontSize: 9 },
  colName: { width: '52%', fontSize: 9 },
  colStat: { width: '10%', fontSize: 9, textAlign: 'center' },
  
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080c14',
    border: '0.5pt solid #1e293b',
    padding: 10,
    marginBottom: 6,
  },
  teamBox: {
    flex: 1,
  },
  teamMain: { fontSize: 10, fontWeight: 'bold' },
  teamSub: { fontSize: 8, color: '#94a3b8' },
  score: {
    width: 70,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#475569',
  }
});

export const PdfRelatorioFase = ({ data }: { data: RelatorioFaseDTO }) => (
  <Document title={`Relatorio_${data?.faseNome}`}>
    
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.torneioNome}>{data?.torneioNome}</Text>
        <Text style={styles.subHeader}>{data?.faseNome} — Classificação Geral</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.colPos}>POS</Text>
        <Text style={styles.colName}>JOGADOR / CLUBE</Text>
        <Text style={styles.colStat}>P</Text>
        <Text style={styles.colStat}>J</Text>
        <Text style={styles.colStat}>V</Text>
        <Text style={styles.colStat}>SG</Text>
      </View>

      {(data?.classificacao || []).map((p, i) => (
        <View key={i} style={[styles.tableRow, { borderLeft: `3pt solid ${p.zonaCor || '#1e293b'}` }]}>
          <Text style={styles.colPos}>{p.posicao}º</Text>
          <View style={styles.colName}>
            <Text>{p.nomeJogador}</Text>
            <Text style={{ fontSize: 7, color: '#94a3b8' }}>{p.nomeClube}</Text>
          </View>
          <Text style={[styles.colStat, { color: '#3b82f6' }]}>{p.pontos}</Text>
          <Text style={styles.colStat}>{p.jogos}</Text>
          <Text style={styles.colStat}>{p.vitorias}</Text>
          <Text style={styles.colStat}>{p.saldoGols}</Text>
        </View>
      ))}
      <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </Page>

    {(data?.rodadas || []).map((rodada) => (
      <Page key={`r-${rodada.numero}`} size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.torneioNome}>{data.torneioNome}</Text>
          <Text style={styles.subHeader}>{data.faseNome}</Text>
        </View>
        <Text style={styles.sectionTitle}>RODADA {rodada.numero}</Text>
        {(rodada.partidas || []).map((p, i) => (
          <View key={i} style={styles.matchCard}>
            <View style={styles.teamBox}>
              <Text style={styles.teamMain}>{p.mandanteClube}</Text>
              <Text style={styles.teamSub}>{p.mandanteJogador}</Text>
            </View>
            <Text style={styles.score}>{p.realizada ? `${p.golsMandante} - ${p.golsVisitante}` : 'vs'}</Text>
            <View style={[styles.teamBox, { textAlign: 'right' }]}>
              <Text style={styles.teamMain}>{p.visitanteClube}</Text>
              <Text style={styles.teamSub}>{p.visitanteJogador}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </Page>
    ))}

    {(data?.agendaJogadores || []).map((agenda, idx) => (
      <Page key={`ag-${idx}`} size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.torneioNome}>{data.torneioNome}</Text>
          <Text style={styles.subHeader}>Agenda Individual de Partidas</Text>
        </View>
        <Text style={styles.sectionTitle}>{agenda.identificador}</Text>
        {(agenda.partidas || []).map((p, i) => (
          <View key={i} style={styles.matchCard}>
            <View style={styles.teamBox}>
              <Text style={styles.teamMain}>{p.mandanteClube}</Text>
              <Text style={styles.teamSub}>{p.mandanteJogador}</Text>
            </View>
            <View style={{ width: 80, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#3b82f6' }}>
                {p.realizada ? `${p.golsMandante} - ${p.golsVisitante}` : 'PENDENTE'}
              </Text>
              <Text style={{ fontSize: 6, color: '#64748b', marginTop: 2 }}>{p.estadio}</Text>
            </View>
            <View style={[styles.teamBox, { textAlign: 'right' }]}>
              <Text style={styles.teamMain}>{p.visitanteClube}</Text>
              <Text style={styles.teamSub}>{p.visitanteJogador}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </Page>
    ))}
  </Document>
);