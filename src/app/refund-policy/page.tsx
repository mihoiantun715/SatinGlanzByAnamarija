'use client';

import React from 'react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Widerrufsbelehrung & Rückgaberecht</h1>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Widerrufsrecht</h2>
              <p>
                Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
              </p>
              <p className="mt-4">
                Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.
              </p>
              <p className="mt-4">
                Um Ihr Widerrufsrecht auszuüben, müssen Sie uns:
              </p>
              <p className="mt-2">
                <strong>SatinGlanz by Anamarija</strong><br />
                Anamarija [Nachname]<br />
                [Straße und Hausnummer]<br />
                [PLZ] [Stadt], Deutschland<br />
                E-Mail: satinglanzbyanamarija@gmail.com
              </p>
              <p className="mt-4">
                mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Folgen des Widerrufs</h2>
              <p>
                Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
              </p>
              <p className="mt-4">
                Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
              </p>
              <p className="mt-4">
                Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.
              </p>
              <p className="mt-4">
                Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.
              </p>
              <p className="mt-4">
                Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.
              </p>
              <p className="mt-4">
                Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Widerrufsrecht für verschiedene Produkttypen</h2>
              
              <div className="mt-6 bg-green-50 border-2 border-green-300 rounded-lg p-6">
                <h3 className="text-lg font-bold text-green-900 mb-3">✅ Fertige Produkte aus unserem Shop</h3>
                <p className="text-green-900 font-semibold mb-3">
                  Für alle fertigen, vorrätigen Produkte aus unserem Standard-Sortiment gilt das <strong>14-tägige Widerrufsrecht</strong>.
                </p>
                <p className="text-green-800">
                  Sie können diese Produkte innerhalb von 14 Tagen ohne Angabe von Gründen zurückgeben. Die Widerrufsfrist beginnt ab dem Tag, an dem Sie die Ware erhalten haben.
                </p>
                <p className="text-green-800 mt-3">
                  <strong>Hinweis:</strong> Die Kosten der Rücksendung trägt der Kunde. Bitte senden Sie die Ware in einwandfreiem Zustand zurück.
                </p>
              </div>

              <div className="mt-6 bg-rose-50 border-2 border-rose-300 rounded-lg p-6">
                <h3 className="text-lg font-bold text-rose-900 mb-3">⚠️ Individuell konfigurierte Produkte (Build Your Bouquet)</h3>
                <p className="text-rose-900 font-semibold mb-3">
                  Für individuell zusammengestellte Produkte über unseren "Build Your Bouquet" Konfigurator besteht <strong>KEIN Widerrufsrecht</strong>.
                </p>
                <p className="text-rose-800">
                  Gemäß § 312g Abs. 2 Nr. 1 BGB besteht das Widerrufsrecht nicht bei Verträgen zur Lieferung von Waren, die <strong>nach Kundenspezifikation angefertigt werden oder eindeutig auf die persönlichen Bedürfnisse zugeschnitten sind</strong>.
                </p>
                <p className="text-rose-800 mt-3">
                  <strong>Das bedeutet:</strong> Wenn Sie ein Produkt individuell konfigurieren (Farbe, Anzahl der Rosen, Dekorationen, Grußkarten etc.), können Sie dieses nicht ohne Grund zurückgeben.
                </p>
                <p className="text-rose-800 mt-3 text-sm">
                  Dies betrifft nur individuell zusammengestellte Bestellungen über den Bouquet-Builder, nicht unsere fertigen Standard-Produkte.
                </p>
              </div>

              <div className="mt-6 bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">✅ Gewährleistungsrechte gelten IMMER</h3>
                <p className="text-blue-800">
                  <strong>Unabhängig vom Produkttyp:</strong> Ihre gesetzlichen Gewährleistungsrechte bleiben unberührt! Sie haben bei ALLEN Produkten Anspruch auf:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2 text-blue-800">
                  <li><strong>Rückgabe bei defekten Produkten</strong> (Herstellungsfehler, Materialfehler)</li>
                  <li><strong>Umtausch bei beschädigter Lieferung</strong> (Transportschäden)</li>
                  <li><strong>Ersatz bei falscher Lieferung</strong> (Sie haben etwas anderes erhalten als bestellt)</li>
                  <li><strong>Gesetzliche Gewährleistung</strong> nach § 437 BGB (2 Jahre)</li>
                </ul>
                <p className="text-blue-800 mt-4">
                  Bei berechtigten Reklamationen übernehmen wir die Kosten für Rücksendung und Ersatz.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Reklamation bei Mängeln</h2>
              <p className="font-semibold text-gray-900">
                Wenn Sie ein defektes, beschädigtes oder falsches Produkt erhalten haben:
              </p>
              <ol className="list-decimal pl-6 mt-4 space-y-3">
                <li>
                  <strong>Kontaktieren Sie uns sofort</strong> – am besten innerhalb von 48 Stunden nach Erhalt der Ware per E-Mail an: <a href="mailto:satinglanzbyanamarija@gmail.com" className="text-rose-500 hover:underline">satinglanzbyanamarija@gmail.com</a>
                </li>
                <li>
                  <strong>Beschreiben Sie den Mangel</strong> – Senden Sie uns Fotos des Produkts und beschreiben Sie das Problem
                </li>
                <li>
                  <strong>Wir prüfen Ihre Reklamation</strong> – Bei berechtigten Mängeln bieten wir Ihnen:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Kostenlose Reparatur</li>
                    <li>Ersatzlieferung</li>
                    <li>Rückerstattung des Kaufpreises</li>
                  </ul>
                </li>
                <li>
                  <strong>Kostenlose Rücksendung</strong> – Bei berechtigten Reklamationen übernehmen wir alle Rücksendekosten
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Rücksendeadresse (nur bei Mängeln)</h2>
              <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <strong>Wichtig:</strong> Senden Sie Produkte nur nach vorheriger Absprache mit uns zurück! Unangekündigte Rücksendungen können nicht bearbeitet werden.
              </p>
              <p>
                <strong>SatinGlanz by Anamarija</strong><br />
                Anamarija [Nachname]<br />
                [Straße und Hausnummer]<br />
                [PLZ] [Stadt]<br />
                Deutschland
              </p>
              <p className="mt-4 text-sm text-gray-600">
                Bitte fügen Sie Ihrer Rücksendung eine Kopie der Bestellbestätigung und eine Beschreibung des Mangels bei.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Kontakt bei Fragen</h2>
              <p>
                Bei Fragen zum Widerrufsrecht oder zur Rücksendung kontaktieren Sie uns bitte:
              </p>
              <p className="mt-2">
                E-Mail: satinglanzbyanamarija@gmail.com<br />
                Telefon: [Telefonnummer]
              </p>
            </section>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-rose-900 mb-2">Muster-Widerrufsformular</h3>
              <p className="text-sm text-rose-800 mb-4">
                Wenn Sie den Vertrag widerrufen wollen, können Sie dieses Formular verwenden:
              </p>
              <div className="bg-white p-4 rounded border border-rose-200 text-sm">
                <p>An SatinGlanz by Anamarija, satinglanzbyanamarija@gmail.com:</p>
                <p className="mt-4">
                  Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)
                </p>
                <p className="mt-2">Bestellt am (*)/erhalten am (*)</p>
                <p className="mt-2">Name des/der Verbraucher(s)</p>
                <p className="mt-2">Anschrift des/der Verbraucher(s)</p>
                <p className="mt-2">Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</p>
                <p className="mt-2">Datum</p>
                <p className="mt-4 text-xs text-gray-500">(*) Unzutreffendes streichen.</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-12">Stand: März 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
