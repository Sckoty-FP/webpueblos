import {
  Document, Page, Text, View, StyleSheet, Font,
} from "@react-pdf/renderer";
import type { PresupuestoDB } from "@/types/servicios-pro";

// Usar fuentes del sistema (sin dependencia de Google Fonts en build)
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1f1f1f",
    padding: "40 48 48 48",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: "1 solid #f0f0f0",
  },
  tag: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 1.5, marginBottom: 4 },
  numero: { fontFamily: "Helvetica-Bold", fontSize: 20, color: "#1f1f1f" },
  fecha:  { fontSize: 9, color: "#6b6b6b", marginTop: 4 },
  negocioNombre: { fontFamily: "Helvetica-Bold", fontSize: 11, textAlign: "right" },
  negocioInfo: { fontSize: 9, color: "#6b6b6b", textAlign: "right", marginTop: 2 },
  badgeEnv: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0369a1", backgroundColor: "#e0f2fe", padding: "3 8", borderRadius: 99, alignSelf: "flex-end", marginTop: 6 },
  badgeAce: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#059669", backgroundColor: "#d1fae5", padding: "3 8", borderRadius: 99, alignSelf: "flex-end", marginTop: 6 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 1.5, marginBottom: 8 },

  clienteBox: { backgroundColor: "#f5f7fa", padding: "12 14", borderRadius: 6 },
  clienteNombre: { fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 3 },
  clienteInfo:   { fontSize: 9, color: "#6b6b6b" },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1f1f1f",
    padding: "8 12",
    borderRadius: "4 4 0 0",
  },
  tableHeaderDesc:  { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 8, color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  tableHeaderPrice: { width: 80, fontFamily: "Helvetica-Bold", fontSize: 8, color: "rgba(255,255,255,0.7)", textAlign: "right", letterSpacing: 1 },

  tableRow: { flexDirection: "row", padding: "9 12", borderBottom: "1 solid #f3f3f3" },
  tableDesc:  { flex: 1, fontSize: 10, color: "#3a3a3a" },
  tablePrice: { width: 80, fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "right" },

  totalesBox:  { alignItems: "flex-end", marginTop: 12 },
  totalesRow:  { flexDirection: "row", justifyContent: "flex-end", gap: 24, marginBottom: 4 },
  totalesLabel:{ fontSize: 9, color: "#6b6b6b", width: 120, textAlign: "right" },
  totalesValue:{ fontSize: 9, color: "#6b6b6b", width: 80, textAlign: "right" },
  totalRow:    { flexDirection: "row", justifyContent: "flex-end", gap: 24, marginTop: 8, paddingTop: 8, borderTop: "2 solid #1f1f1f" },
  totalLabel:  { fontFamily: "Helvetica-Bold", fontSize: 12, width: 120, textAlign: "right" },
  totalValue:  { fontFamily: "Helvetica-Bold", fontSize: 16, width: 80, textAlign: "right" },

  nota: { fontSize: 9, color: "#6b6b6b", fontStyle: "italic", marginTop: 16 },
  validez: { fontSize: 9, color: "#d97706", marginTop: 4 },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    borderTop: "1 solid #f3f3f3",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: "#6b6b6b" },
});

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

interface Props {
  presupuesto:  PresupuestoDB;
  negocioNombre: string;
}

export function PresupuestoPDF({ presupuesto: p, negocioNombre }: Props) {
  const estadoBadge = p.estado === "aceptado" ? styles.badgeAce : styles.badgeEnv;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.tag}>PRESUPUESTO</Text>
            <Text style={styles.numero}>{p.numero}</Text>
            <Text style={styles.fecha}>
              Emitido el {new Date(p.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
          </View>
          <View>
            <Text style={styles.negocioNombre}>{negocioNombre}</Text>
            <Text style={styles.badgeEnv}>{p.estado.toUpperCase()}</Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLIENTE</Text>
          <View style={styles.clienteBox}>
            <Text style={styles.clienteNombre}>{p.cliente_nombre}</Text>
            {p.cliente_email    && <Text style={styles.clienteInfo}>{p.cliente_email}</Text>}
            {p.cliente_telefono && <Text style={styles.clienteInfo}>{p.cliente_telefono}</Text>}
            {p.cliente_direccion && <Text style={styles.clienteInfo}>{p.cliente_direccion}</Text>}
          </View>
        </View>

        {/* Descripción */}
        {p.descripcion ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DESCRIPCIÓN DEL TRABAJO</Text>
            <Text style={{ fontSize: 10, color: "#3a3a3a", lineHeight: 1.6 }}>{p.descripcion}</Text>
          </View>
        ) : null}

        {/* Tabla líneas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESGLOSE</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderDesc}>CONCEPTO</Text>
            <Text style={styles.tableHeaderPrice}>IMPORTE</Text>
          </View>
          {p.lineas.map((l, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableDesc}>{l.descripcion}</Text>
              <Text style={styles.tablePrice}>{fmt(l.importe)}</Text>
            </View>
          ))}

          {/* Totales */}
          <View style={styles.totalesBox}>
            <View style={styles.totalesRow}>
              <Text style={styles.totalesLabel}>Base imponible</Text>
              <Text style={styles.totalesValue}>{fmt(p.importe_base)}</Text>
            </View>
            <View style={styles.totalesRow}>
              <Text style={styles.totalesLabel}>IVA ({p.iva_porcentaje}%)</Text>
              <Text style={styles.totalesValue}>{fmt(p.importe_total - p.importe_base)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>{fmt(p.importe_total)}</Text>
            </View>
          </View>
        </View>

        {/* Notas */}
        {p.notas && <Text style={styles.nota}>{p.notas}</Text>}
        {p.valido_hasta && (
          <Text style={styles.validez}>
            Válido hasta el {new Date(p.valido_hasta).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{negocioNombre}</Text>
          <Text style={styles.footerText}>{p.numero}</Text>
        </View>
      </Page>
    </Document>
  );
}

export default PresupuestoPDF;
