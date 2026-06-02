import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ParteConPresupuesto } from "@/types/servicios-pro";

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
    marginBottom: 24,
    paddingBottom: 18,
    borderBottom: "1 solid #f0f0f0",
  },
  tag:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 1.5, marginBottom: 4 },
  numero: { fontFamily: "Helvetica-Bold", fontSize: 20 },
  fecha:  { fontSize: 9, color: "#6b6b6b", marginTop: 4 },
  negocioNombre: { fontFamily: "Helvetica-Bold", fontSize: 11, textAlign: "right" },
  badgeCobrado: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#059669", backgroundColor: "#d1fae5", padding: "3 8", borderRadius: 99, alignSelf: "flex-end", marginTop: 6 },
  badgePendiente: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#d97706", backgroundColor: "#fef3c7", padding: "3 8", borderRadius: 99, alignSelf: "flex-end", marginTop: 6 },

  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 1.5, marginBottom: 8 },

  row2: { flexDirection: "row", gap: 16, marginBottom: 20 },
  box:  { flex: 1, backgroundColor: "#f5f7fa", padding: "12 14", borderRadius: 6 },
  boxLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b6b6b", letterSpacing: 1, marginBottom: 4 },
  boxValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },

  section: { marginBottom: 18 },
  textBlock: { fontSize: 10, color: "#3a3a3a", lineHeight: 1.6, backgroundColor: "#f5f7fa", padding: "10 12", borderRadius: 6 },

  importeBox: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 16, marginBottom: 20, backgroundColor: "#1f1f1f", padding: "12 16", borderRadius: 8 },
  importeLabel: { fontFamily: "Helvetica-Bold", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 1 },
  importeValue: { fontFamily: "Helvetica-Bold", fontSize: 20, color: "#ffffff" },
  metodoCobro: { fontSize: 9, color: "rgba(255,255,255,0.5)" },

  firmaSection: { marginTop: 8, marginBottom: 20 },
  firmaImg: { width: 200, height: 80, backgroundColor: "#f5f7fa", borderRadius: 6, border: "1 solid #e5e5e5" },
  sinFirma: { width: 200, height: 80, backgroundColor: "#f5f7fa", borderRadius: 6, border: "1 dashed #cccccc", justifyContent: "center", alignItems: "center" },
  sinFirmaText: { fontSize: 9, color: "#cccccc" },

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
  parte:         ParteConPresupuesto;
  negocioNombre: string;
}

export function PartePDF({ parte: p, negocioNombre }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.tag}>PARTE DE TRABAJO</Text>
            <Text style={styles.numero}>{p.numero}</Text>
            <Text style={styles.fecha}>
              {new Date(p.fecha_trabajo + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
          </View>
          <View>
            <Text style={styles.negocioNombre}>{negocioNombre}</Text>
            <Text style={p.cobrado ? styles.badgeCobrado : styles.badgePendiente}>
              {p.cobrado ? "COBRADO" : "PENDIENTE"}
            </Text>
          </View>
        </View>

        {/* Cliente + presupuesto origen */}
        {p.presupuesto && (
          <View style={styles.row2}>
            <View style={styles.box}>
              <Text style={styles.boxLabel}>CLIENTE</Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 2 }}>{p.presupuesto.cliente_nombre}</Text>
              {p.presupuesto.cliente_telefono && <Text style={{ fontSize: 9, color: "#6b6b6b" }}>{p.presupuesto.cliente_telefono}</Text>}
              {p.presupuesto.cliente_email && <Text style={{ fontSize: 9, color: "#6b6b6b" }}>{p.presupuesto.cliente_email}</Text>}
            </View>
            <View style={styles.box}>
              <Text style={styles.boxLabel}>ORIGEN</Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>Pres. {p.presupuesto.numero}</Text>
              {p.duracion_horas && <Text style={{ fontSize: 9, color: "#6b6b6b", marginTop: 4 }}>{p.duracion_horas} horas de trabajo</Text>}
            </View>
          </View>
        )}

        {/* Trabajo realizado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TRABAJO REALIZADO</Text>
          <Text style={styles.textBlock}>{p.trabajo_realizado}</Text>
        </View>

        {/* Materiales */}
        {p.materiales && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MATERIALES UTILIZADOS</Text>
            <Text style={styles.textBlock}>{p.materiales}</Text>
          </View>
        )}

        {/* Importe */}
        <View style={styles.importeBox}>
          <View>
            <Text style={styles.importeLabel}>IMPORTE FINAL</Text>
            {p.cobrado && p.metodo_cobro && (
              <Text style={styles.metodoCobro}>Cobrado en {p.metodo_cobro}</Text>
            )}
          </View>
          <Text style={styles.importeValue}>{fmt(p.importe_final)}</Text>
        </View>

        {/* Firma */}
        <View style={styles.firmaSection}>
          <Text style={styles.sectionTitle}>FIRMA DEL CLIENTE</Text>
          {p.cliente_firma_url ? (
            <Image src={p.cliente_firma_url} style={styles.firmaImg} />
          ) : (
            <View style={styles.sinFirma}>
              <Text style={styles.sinFirmaText}>Sin firma digital</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{negocioNombre}</Text>
          <Text style={styles.footerText}>{p.numero}</Text>
        </View>
      </Page>
    </Document>
  );
}

export default PartePDF;
