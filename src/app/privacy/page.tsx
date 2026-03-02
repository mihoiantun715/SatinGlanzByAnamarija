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
            {currentContent.sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{section.heading}</h2>
                {section.content.map((item, i) => (
                  <div key={i} className="mt-4">
                    {item.subtitle && <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">{item.subtitle}</h3>}
                    <p>{item.text}</p>
                  </div>
                ))}
              </section>
            ))}
            <p className="text-sm text-gray-500 mt-12">{locale === 'de' ? 'Stand: März 2026' : locale === 'en' ? 'Last updated: March 2026' : locale === 'hr' ? 'Ažurirano: Ožujak 2026' : locale === 'ro' ? 'Actualizat: Martie 2026' : locale === 'bg' ? 'Актуализирано: Март 2026' : 'Güncelleme: Mart 2026'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
