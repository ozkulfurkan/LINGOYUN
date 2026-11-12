#!/usr/bin/env node
// Pushes the App Store listing from store/listings.json to App Store Connect:
// names, subtitles, privacy and support URLs, descriptions, keywords,
// promotional text, category, age rating, copyright and App Review contact.
//
//   node scripts/asc-metadata.mjs            push everything
//   node scripts/asc-metadata.mjs --dry-run  print what would be sent
//
// Screenshots: scripts/asc-screenshots.mjs. App Privacy labels cannot be set
// through the API (store/privacy-labels.md, by hand on the website).
import fs from 'node:fs';
import path from 'node:path';

import { asc, findApp } from './asc.mjs';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')),
  '..',
);
const listings = JSON.parse(fs.readFileSync(path.join(ROOT, 'store/listings.json'), 'utf8'));
const DRY = process.argv.includes('--dry-run');

const VERSION = '1.0.0';
const COPYRIGHT = '© 2026 Furkan Özkul';
const SUPPORT_URL = 'https://ozkulfurkan.github.io/LINGOYUN/support/';
const PRIVACY = {
  tr: 'https://ozkulfurkan.github.io/LINGOYUN/privacy/tr.html',
  'en-US': 'https://ozkulfurkan.github.io/LINGOYUN/privacy/',
};
// store/listings.json key → App Store Connect locale.
const LOCALES = { 'tr-TR': 'tr', 'en-US': 'en-US' };

const REVIEW = {
  contactFirstName: 'Furkan',
  contactLastName: 'Özkul',
  contactEmail: 'ozkulfurkann@gmail.com',
  contactPhone: '+905343956402',
  demoAccountRequired: false,
  notes: [
    'No account or sign-in. The app opens with profile creation: choose "Adult", answer the self-assessment and the short placement test; the family plans (paywall) appear after the result.',
    'Free trial: on iOS the 7-day free trial is the free non-consumable "7-Day Free Trial" (App Review Guideline 3.1.1). It never renews or charges; afterwards a monthly or yearly auto-renewable family subscription is offered.',
    'Parental gate: while a child profile (ages 2-7 or 7-12) is active, settings and purchases sit behind a multiplication question written in words (for example "yedi çarpı sekiz" = 56). The adult profile opens them directly.',
    'Child profiles are created from Settings > "Çocuğum için profil oluştur". All data stays on the device; no ads, no tracking.',
  ].join('\n\n'),
};

// Age rating: nothing of the kind in the app. Parental controls: the parental
// gate in front of settings and purchases on child profiles.
const AGE_RATING = {
  alcoholTobaccoOrDrugUseOrReferences: 'NONE',
  contests: 'NONE',
  gamblingSimulated: 'NONE',
  gunsOrOtherWeapons: 'NONE',
  horrorOrFearThemes: 'NONE',
  matureOrSuggestiveThemes: 'NONE',
  medicalOrTreatmentInformation: 'NONE',
  profanityOrCrudeHumor: 'NONE',
  sexualContentGraphicAndNudity: 'NONE',
  sexualContentOrNudity: 'NONE',
  violenceCartoonOrFantasy: 'NONE',
  violenceRealistic: 'NONE',
  violenceRealisticProlongedGraphicOrSadistic: 'NONE',
  advertising: false,
  ageAssurance: false,
  gambling: false,
  healthOrWellnessTopics: false,
  lootBox: false,
  messagingAndChat: false,
  parentalControls: true,
  socialMedia: false,
  unrestrictedWebAccess: false,
  userGeneratedContent: false,
};

async function send(method, url, body, label) {
  if (DRY) {
    console.log(`[dry] ${label}: ${method} ${url}`, JSON.stringify(body?.data?.attributes ?? {}));
    return null;
  }
  const result = await asc(method, url, body);
  console.log(`ok  ${label}`);
  return result;
}

async function main() {
  const app = await findApp();
  const { data: versions } = await asc(
    'GET',
    `/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS`,
  );
  const version = versions.find((v) =>
    ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'].includes(
      v.attributes.appStoreState,
    ),
  );
  if (!version) throw new Error('no editable App Store version');
  const { data: infos } = await asc('GET', `/v1/apps/${app.id}/appInfos`);
  const info = infos.find((i) => i.attributes.appStoreState !== 'READY_FOR_SALE') ?? infos[0];

  // Version: number, copyright.
  await send(
    'PATCH',
    `/v1/appStoreVersions/${version.id}`,
    {
      data: {
        type: 'appStoreVersions',
        id: version.id,
        attributes: { versionString: VERSION, copyright: COPYRIGHT },
      },
    },
    `version ${VERSION}`,
  );

  // Category.
  await send(
    'PATCH',
    `/v1/appInfos/${info.id}`,
    {
      data: {
        type: 'appInfos',
        id: info.id,
        relationships: { primaryCategory: { data: { type: 'appCategories', id: 'EDUCATION' } } },
      },
    },
    'category Education',
  );

  // Age rating (same id as the app info).
  const { data: age } = await asc('GET', `/v1/appInfos/${info.id}/ageRatingDeclaration`);
  await send(
    'PATCH',
    `/v1/ageRatingDeclarations/${age.id}`,
    { data: { type: 'ageRatingDeclarations', id: age.id, attributes: AGE_RATING } },
    'age rating',
  );

  // Per language: app info (name, subtitle, privacy) and version texts.
  const { data: infoLocs } = await asc('GET', `/v1/appInfos/${info.id}/appInfoLocalizations`);
  for (const [key, locale] of Object.entries(LOCALES)) {
    const listing = listings[key];
    const infoAttrs = {
      name: listing.appStore.name,
      subtitle: listing.appStore.subtitle,
      privacyPolicyUrl: PRIVACY[locale],
    };
    const infoLoc = infoLocs.find((l) => l.attributes.locale === locale);
    if (infoLoc) {
      await send(
        'PATCH',
        `/v1/appInfoLocalizations/${infoLoc.id}`,
        { data: { type: 'appInfoLocalizations', id: infoLoc.id, attributes: infoAttrs } },
        `${locale} name and subtitle`,
      );
    } else {
      await send(
        'POST',
        '/v1/appInfoLocalizations',
        {
          data: {
            type: 'appInfoLocalizations',
            attributes: { locale, ...infoAttrs },
            relationships: { appInfo: { data: { type: 'appInfos', id: info.id } } },
          },
        },
        `${locale} name and subtitle (new)`,
      );
    }

    // Read again: adding a language to the app info also adds it to the version.
    const { data: verLocs } = await asc(
      'GET',
      `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`,
    );
    // "What's new" is not allowed on a first version.
    const verAttrs = {
      description: listing.description,
      keywords: listing.appStore.keywords,
      promotionalText: listing.appStore.promotionalText,
      supportUrl: SUPPORT_URL,
    };
    const verLoc = verLocs.find((l) => l.attributes.locale === locale);
    if (verLoc) {
      await send(
        'PATCH',
        `/v1/appStoreVersionLocalizations/${verLoc.id}`,
        { data: { type: 'appStoreVersionLocalizations', id: verLoc.id, attributes: verAttrs } },
        `${locale} description`,
      );
    } else {
      await send(
        'POST',
        '/v1/appStoreVersionLocalizations',
        {
          data: {
            type: 'appStoreVersionLocalizations',
            attributes: { locale, ...verAttrs },
            relationships: {
              appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } },
            },
          },
        },
        `${locale} description (new)`,
      );
    }
  }

  // App Review contact and notes.
  let review = null;
  try {
    review = (await asc('GET', `/v1/appStoreVersions/${version.id}/appStoreReviewDetail`)).data;
  } catch {
    review = null;
  }
  if (review) {
    await send(
      'PATCH',
      `/v1/appStoreReviewDetails/${review.id}`,
      { data: { type: 'appStoreReviewDetails', id: review.id, attributes: REVIEW } },
      'App Review details',
    );
  } else {
    await send(
      'POST',
      '/v1/appStoreReviewDetails',
      {
        data: {
          type: 'appStoreReviewDetails',
          attributes: REVIEW,
          relationships: {
            appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } },
          },
        },
      },
      'App Review details (new)',
    );
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
