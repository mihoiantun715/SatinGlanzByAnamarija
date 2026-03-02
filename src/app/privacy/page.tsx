'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function PrivacyPage() {
  const { locale } = useLanguage();

  const content = {
    de: {
      title: 'Datenschutzerklärung',
      sections: [
        {
          heading: '1. Datenschutz auf einen Blick',
          content: [
            { subtitle: 'Allgemeine Hinweise', text: 'Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.' },
            { subtitle: 'Datenerfassung auf dieser Website', text: 'Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.' }
          ]
        },
        {
          heading: '2. Hosting',
          content: [
            { subtitle: 'Externes Hosting', text: 'Diese Website wird bei Vercel gehostet. Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert.' }
          ]
        },
        {
          heading: '3. Allgemeine Hinweise und Pflichtinformationen',
          content: [
            { subtitle: 'Datenschutz', text: 'Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.' }
          ]
        }
      ]
    },
    en: {
      title: 'Privacy Policy',
      sections: [
        {
          heading: '1. Privacy at a Glance',
          content: [
            { subtitle: 'General Information', text: 'The following notes provide a simple overview of what happens to your personal data when you visit this website. Personal data is any data that can be used to identify you personally.' },
            { subtitle: 'Data Collection on This Website', text: 'Data processing on this website is carried out by the website operator. You can find their contact details in the imprint of this website.' }
          ]
        },
        {
          heading: '2. Hosting',
          content: [
            { subtitle: 'External Hosting', text: 'This website is hosted by Vercel. The personal data collected on this website is stored on the host\'s servers.' }
          ]
        },
        {
          heading: '3. General Information and Mandatory Information',
          content: [
            { subtitle: 'Data Protection', text: 'The operators of this website take the protection of your personal data very seriously. We treat your personal data confidentially and in accordance with statutory data protection regulations and this privacy policy.' }
          ]
        }
      ]
    },
    hr: {
      title: 'Politika privatnosti',
      sections: [
        {
          heading: '1. Privatnost ukratko',
          content: [
            { subtitle: 'Opće informacije', text: 'Sljedeće napomene pružaju jednostavan pregled onoga što se događa s vašim osobnim podacima kada posjetite ovu web stranicu. Osobni podaci su svi podaci kojima se možete osobno identificirati.' },
            { subtitle: 'Prikupljanje podataka na ovoj web stranici', text: 'Obrada podataka na ovoj web stranici provodi se od strane operatera web stranice. Njihove kontakt podatke možete pronaći u impresu ove web stranice.' }
          ]
        },
        {
          heading: '2. Hosting',
          content: [
            { subtitle: 'Vanjski hosting', text: 'Ova web stranica hostirana je na Vercelu. Osobni podaci prikupljeni na ovoj web stranici pohranjuju se na poslužiteljima hosta.' }
          ]
        },
        {
          heading: '3. Opće informacije i obvezne informacije',
          content: [
            { subtitle: 'Zaštita podataka', text: 'Operateri ove web stranice vrlo ozbiljno shvaćaju zaštitu vaših osobnih podataka. S vašim osobnim podacima postupamo povjerljivo i u skladu sa zakonskim propisima o zaštiti podataka i ovom politikom privatnosti.' }
          ]
        }
      ]
    },
    ro: {
      title: 'Politica de confidențialitate',
      sections: [
        {
          heading: '1. Confidențialitate pe scurt',
          content: [
            { subtitle: 'Informații generale', text: 'Următoarele note oferă o prezentare simplă a ceea ce se întâmplă cu datele dvs. personale atunci când vizitați acest site web. Datele personale sunt toate datele care vă pot identifica personal.' },
            { subtitle: 'Colectarea datelor pe acest site web', text: 'Prelucrarea datelor pe acest site web este efectuată de operatorul site-ului web. Puteți găsi detaliile lor de contact în impresumul acestui site web.' }
          ]
        },
        {
          heading: '2. Găzduire',
          content: [
            { subtitle: 'Găzduire externă', text: 'Acest site web este găzduit de Vercel. Datele personale colectate pe acest site web sunt stocate pe serverele gazdei.' }
          ]
        },
        {
          heading: '3. Informații generale și informații obligatorii',
          content: [
            { subtitle: 'Protecția datelor', text: 'Operatorii acestui site web iau foarte în serios protecția datelor dvs. personale. Tratăm datele dvs. personale în mod confidențial și în conformitate cu reglementările legale privind protecția datelor și cu această politică de confidențialitate.' }
          ]
        }
      ]
    },
    bg: {
      title: 'Политика за поверителност',
      sections: [
        {
          heading: '1. Поверителност накратко',
          content: [
            { subtitle: 'Обща информация', text: 'Следните бележки предоставят прост преглед на това, какво се случва с вашите лични данни, когато посетите този уебсайт. Личните данни са всички данни, които могат да ви идентифицират лично.' },
            { subtitle: 'Събиране на данни на този уебсайт', text: 'Обработката на данни на този уебсайт се извършва от оператора на уебсайта. Можете да намерите техните данни за контакт в импресума на този уебсайт.' }
          ]
        },
        {
          heading: '2. Хостинг',
          content: [
            { subtitle: 'Външен хостинг', text: 'Този уебсайт се хоства от Vercel. Личните данни, събрани на този уебсайт, се съхраняват на сървърите на хоста.' }
          ]
        },
        {
          heading: '3. Обща информация и задължителна информация',
          content: [
            { subtitle: 'Защита на данните', text: 'Операторите на този уебсайт много сериозно се отнасят към защитата на вашите лични данни. Третираме вашите лични данни поверително и в съответствие със законовите разпоредби за защита на данните и тази политика за поверителност.' }
          ]
        }
      ]
    },
    tr: {
      title: 'Gizlilik Politikası',
      sections: [
        {
          heading: '1. Gizlilik Bir Bakışta',
          content: [
            { subtitle: 'Genel Bilgiler', text: 'Aşağıdaki notlar, bu web sitesini ziyaret ettiğinizde kişisel verilerinize ne olduğuna dair basit bir genel bakış sağlar. Kişisel veriler, sizi kişisel olarak tanımlamak için kullanılabilecek tüm verilerdir.' },
            { subtitle: 'Bu Web Sitesinde Veri Toplama', text: 'Bu web sitesindeki veri işleme, web sitesi operatörü tarafından gerçekleştirilir. İletişim bilgilerini bu web sitesinin künye bölümünde bulabilirsiniz.' }
          ]
        },
        {
          heading: '2. Barındırma',
          content: [
            { subtitle: 'Harici Barındırma', text: 'Bu web sitesi Vercel tarafından barındırılmaktadır. Bu web sitesinde toplanan kişisel veriler, barındırıcının sunucularında saklanır.' }
          ]
        },
        {
          heading: '3. Genel Bilgiler ve Zorunlu Bilgiler',
          content: [
            { subtitle: 'Veri Koruma', text: 'Bu web sitesinin operatörleri kişisel verilerinizin korunmasını çok ciddiye alır. Kişisel verilerinizi gizli olarak ve yasal veri koruma düzenlemelerine ve bu gizlilik politikasına uygun olarak ele alırız.' }
          ]
        }
      ]
    }
  };

  const currentContent = content[locale as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{currentContent.title}</h1>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Datenschutz auf einen Blick</h2>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Allgemeine Hinweise</h3>
              <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Datenerfassung auf dieser Website</h3>
              <p><strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong></p>
              <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.</p>
              
              <p className="mt-4"><strong>Wie erfassen wir Ihre Daten?</strong></p>
              <p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben.</p>
              <p>Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Hosting und Content Delivery Networks (CDN)</h2>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Externes Hosting</h3>
              <p>Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v.a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.</p>
              
              <p className="mt-4">Der Einsatz des Hosters erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Datenschutz</h3>
              <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
              
              <p className="mt-4">Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Hinweis zur verantwortlichen Stelle</h3>
              <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
              <p className="mt-2">
                <strong>SatinGlanz by Anamarija</strong><br />
                Anamarija [Nachname]<br />
                [Straße und Hausnummer]<br />
                [PLZ] [Stadt], Deutschland<br />
                E-Mail: satinglanzbyanamarija@gmail.com
              </p>
              
              <p className="mt-4">Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.B. Namen, E-Mail-Adressen o. Ä.) entscheidet.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Datenerfassung auf dieser Website</h2>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Cookies</h3>
              <p>Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Textdateien und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert.</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Kontaktformular</h3>
              <p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Anfrage per E-Mail, Telefon oder Telefax</h3>
              <p>Wenn Sie uns per E-Mail, Telefon oder Telefax kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Zahlungsanbieter</h2>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Stripe</h3>
              <p>Wir nutzen auf dieser Website den Zahlungsdienstleister Stripe. Anbieter ist die Stripe Payments Europe Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland (nachfolgend „Stripe").</p>
              
              <p className="mt-4">Wenn Sie sich für eine Zahlung mit Stripe entscheiden, erfolgt die Zahlungsabwicklung über Stripe. Dabei werden Ihre Zahlungsdaten (z.B. Kreditkartennummer) an Stripe übermittelt. Die Übermittlung Ihrer Daten an Stripe erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) und Art. 6 Abs. 1 lit. b DSGVO (Verarbeitung zur Erfüllung eines Vertrags).</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Ihre Rechte</h2>
              
              <p>Sie haben jederzeit das Recht:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>gemäß Art. 15 DSGVO Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten zu verlangen</li>
                <li>gemäß Art. 16 DSGVO unverzüglich die Berichtigung unrichtiger oder Vervollständigung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen</li>
                <li>gemäß Art. 17 DSGVO die Löschung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen</li>
                <li>gemäß Art. 18 DSGVO die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen</li>
                <li>gemäß Art. 20 DSGVO Ihre personenbezogenen Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten</li>
                <li>gemäß Art. 77 DSGVO sich bei einer Aufsichtsbehörde zu beschweren</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Widerspruchsrecht</h2>
              <p>Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Sie betreffender personenbezogener Daten, die aufgrund von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, Widerspruch einzulegen.</p>
            </section>

            <p className="text-sm text-gray-500 mt-12">Stand: März 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
