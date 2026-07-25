/**
 * video/src/Root.tsx — Remotion composition registry (vocabulary lessons).
 *
 * One vertical 9:16 composition per lesson. Lesson data is the SHARED corpus at
 * ../../web/src/corpus — the single source of truth with the learning site and
 * the audio-authoring tool. Audio is served from ../web/public via the publicDir
 * set in remotion.config.ts. Composition ids are STABLE: the render:vocab-*
 * scripts in package.json depend on them.
 */
import type { FC } from "react";
import { Composition } from "remotion";
import { z } from "zod";
import {
  VocabLessonComposition,
  TOTAL_FRAMES as VOCAB_TOTAL_FRAMES,
  FPS as VOCAB_FPS,
} from "./VocabLesson";
import { VocabLessonSchema, type VocabLesson } from "../../web/src/corpus-types/vocab";

import lesson_ego_ego_alt from "../../web/src/corpus/lesson-ego-ego-alt.json";
import lesson_intro_extro_ambi from "../../web/src/corpus/lesson-intro-extro-ambi.json";
import lesson_misanthrope_misogynist_misogamist from "../../web/src/corpus/lesson-misanthrope-misogynist-misogamist.json";
import lesson_ascetic_austere_stoic from "../../web/src/corpus/lesson-ascetic-austere-stoic.json";
import lesson_cardio_neuro_psych from "../../web/src/corpus/lesson-cardio-neuro-psych.json";
import lesson_derm_ophth_ortho from "../../web/src/corpus/lesson-derm-ophth-ortho.json";
import lesson_gyn_obstetric_pediatric from "../../web/src/corpus/lesson-gyn-obstetric-pediatric.json";
import lesson_psych_analyst_grapho from "../../web/src/corpus/lesson-psych-analyst-grapho.json";
import lesson_ortho_optom_podo from "../../web/src/corpus/lesson-ortho-optom-podo.json";
import lesson_osteo_chiro_geron from "../../web/src/corpus/lesson-osteo-chiro-geron.json";
import lesson_anthro_socio_philo from "../../web/src/corpus/lesson-anthro-socio-philo.json";
import lesson_astro_geo_bio from "../../web/src/corpus/lesson-astro-geo-bio.json";
import lesson_botany_zoo_ento from "../../web/src/corpus/lesson-botany-zoo-ento.json";
import lesson_notorious_consummate_glib from "../../web/src/corpus/lesson-notorious-consummate-glib.json";
import lesson_incorrigible_inveterate_chronic from "../../web/src/corpus/lesson-incorrigible-inveterate-chronic.json";
import lesson_pathological_unconscionable_egregious from "../../web/src/corpus/lesson-pathological-unconscionable-egregious.json";
import lesson_disparage_malign_equivocate from "../../web/src/corpus/lesson-disparage-malign-equivocate.json";
import lesson_adulate_titillate_placate from "../../web/src/corpus/lesson-adulate-titillate-placate.json";
import lesson_proscribe_militate_obviate from "../../web/src/corpus/lesson-proscribe-militate-obviate.json";
import lesson_taciturn_laconic_inarticulate from "../../web/src/corpus/lesson-taciturn-laconic-inarticulate.json";
import lesson_loquacious_voluble_verbose from "../../web/src/corpus/lesson-loquacious-voluble-verbose.json";
import lesson_cogent_banal_vociferous from "../../web/src/corpus/lesson-cogent-banal-vociferous.json";
import lesson_martinet_sycophant_dilettante from "../../web/src/corpus/lesson-martinet-sycophant-dilettante.json";
import lesson_iconoclast_monomaniac_chauvinist from "../../web/src/corpus/lesson-iconoclast-monomaniac-chauvinist.json";
import lesson_atheist_agnostic_hypochondriac from "../../web/src/corpus/lesson-atheist-agnostic-hypochondriac.json";
import lesson_convivial_magnanimous_urbane from "../../web/src/corpus/lesson-convivial-magnanimous-urbane.json";
import lesson_indefatigable_versatile_intrepid from "../../web/src/corpus/lesson-indefatigable-versatile-intrepid.json";
import lesson_ingenuous_perspicacious_suave from "../../web/src/corpus/lesson-ingenuous-perspicacious-suave.json";
import lesson_penury_ephemeral_nostalgia from "../../web/src/corpus/lesson-penury-ephemeral-nostalgia.json";
import lesson_vicarious_euphemism_clandestine from "../../web/src/corpus/lesson-vicarious-euphemism-clandestine.json";
import lesson_cacophony_bovine_carnivorous from "../../web/src/corpus/lesson-cacophony-bovine-carnivorous.json";
import lesson_enervate_vegetate_vacillate from "../../web/src/corpus/lesson-enervate-vegetate-vacillate.json";
import lesson_castigate_abnegate_recapitulate from "../../web/src/corpus/lesson-castigate-abnegate-recapitulate.json";
import lesson_insinuate_dissimulate_commiserate from "../../web/src/corpus/lesson-insinuate-dissimulate-commiserate.json";
import lesson_obsequious_supercilious_querulous from "../../web/src/corpus/lesson-obsequious-supercilious-querulous.json";
import lesson_obstreperous_impecunious_innocuous from "../../web/src/corpus/lesson-obstreperous-impecunious-innocuous.json";
import lesson_bibulous_cadaverous_lugubrious from "../../web/src/corpus/lesson-bibulous-cadaverous-lugubrious.json";

const VocabLessonPropsSchema = z.object({ lesson: VocabLessonSchema });

// Composition id -> lesson. Parsed through the schema so any JSON drift fails
// fast at registration time, not during render.
const VOCAB: Array<{ id: string; lesson: VocabLesson }> = [
  { id: "VocabEgoEgoAlt", lesson: VocabLessonSchema.parse(lesson_ego_ego_alt) },
  { id: "VocabIntroExtroAmbi", lesson: VocabLessonSchema.parse(lesson_intro_extro_ambi) },
  { id: "VocabHaters", lesson: VocabLessonSchema.parse(lesson_misanthrope_misogynist_misogamist) },
  { id: "VocabRestraint", lesson: VocabLessonSchema.parse(lesson_ascetic_austere_stoic) },
  { id: "VocabCardioNeuroPsych", lesson: VocabLessonSchema.parse(lesson_cardio_neuro_psych) },
  { id: "VocabDermOphthOrtho", lesson: VocabLessonSchema.parse(lesson_derm_ophth_ortho) },
  { id: "VocabGynObstetricPediatric", lesson: VocabLessonSchema.parse(lesson_gyn_obstetric_pediatric) },
  { id: "VocabPsychAnalystGrapho", lesson: VocabLessonSchema.parse(lesson_psych_analyst_grapho) },
  { id: "VocabOrthoOptomPodo", lesson: VocabLessonSchema.parse(lesson_ortho_optom_podo) },
  { id: "VocabOsteoChiroGeron", lesson: VocabLessonSchema.parse(lesson_osteo_chiro_geron) },
  { id: "VocabAnthroSocioPhilo", lesson: VocabLessonSchema.parse(lesson_anthro_socio_philo) },
  { id: "VocabAstroGeoBio", lesson: VocabLessonSchema.parse(lesson_astro_geo_bio) },
  { id: "VocabBotanyZooEnto", lesson: VocabLessonSchema.parse(lesson_botany_zoo_ento) },
  { id: "VocabNotorConsumGlib", lesson: VocabLessonSchema.parse(lesson_notorious_consummate_glib) },
  { id: "VocabIncorrigInvetChronic", lesson: VocabLessonSchema.parse(lesson_incorrigible_inveterate_chronic) },
  { id: "VocabPathUnconsEgreg", lesson: VocabLessonSchema.parse(lesson_pathological_unconscionable_egregious) },
  { id: "VocabDisparageMalignEquiv", lesson: VocabLessonSchema.parse(lesson_disparage_malign_equivocate) },
  { id: "VocabAdulateTitillatePlacate", lesson: VocabLessonSchema.parse(lesson_adulate_titillate_placate) },
  { id: "VocabProscribeMilitateObviate", lesson: VocabLessonSchema.parse(lesson_proscribe_militate_obviate) },
  { id: "VocabTaciturnLaconicInart", lesson: VocabLessonSchema.parse(lesson_taciturn_laconic_inarticulate) },
  { id: "VocabLoquaciousVolubleVerbose", lesson: VocabLessonSchema.parse(lesson_loquacious_voluble_verbose) },
  { id: "VocabCogentBanalVociferous", lesson: VocabLessonSchema.parse(lesson_cogent_banal_vociferous) },
  { id: "VocabMartinetSycophantDilettante", lesson: VocabLessonSchema.parse(lesson_martinet_sycophant_dilettante) },
  { id: "VocabIconoclastMonoChauvin", lesson: VocabLessonSchema.parse(lesson_iconoclast_monomaniac_chauvinist) },
  { id: "VocabAtheistAgnosticHypo", lesson: VocabLessonSchema.parse(lesson_atheist_agnostic_hypochondriac) },
  { id: "VocabConvivialMagnanimousUrbane", lesson: VocabLessonSchema.parse(lesson_convivial_magnanimous_urbane) },
  { id: "VocabIndefatigableVersatileIntrepid", lesson: VocabLessonSchema.parse(lesson_indefatigable_versatile_intrepid) },
  { id: "VocabIngenuousPerspicaciousSuave", lesson: VocabLessonSchema.parse(lesson_ingenuous_perspicacious_suave) },
  { id: "VocabPenuryEphemeralNostalgia", lesson: VocabLessonSchema.parse(lesson_penury_ephemeral_nostalgia) },
  { id: "VocabVicariousEuphemismClandestine", lesson: VocabLessonSchema.parse(lesson_vicarious_euphemism_clandestine) },
  { id: "VocabCacophonyBovineCarnivorous", lesson: VocabLessonSchema.parse(lesson_cacophony_bovine_carnivorous) },
  { id: "VocabEnervateVegetateVacillate", lesson: VocabLessonSchema.parse(lesson_enervate_vegetate_vacillate) },
  { id: "VocabCastigateAbnegateRecap", lesson: VocabLessonSchema.parse(lesson_castigate_abnegate_recapitulate) },
  { id: "VocabInsinuateDissimulateCommiserate", lesson: VocabLessonSchema.parse(lesson_insinuate_dissimulate_commiserate) },
  { id: "VocabObsequiousSuperciliousQuerulous", lesson: VocabLessonSchema.parse(lesson_obsequious_supercilious_querulous) },
  { id: "VocabObstreperousImpecuniousInnocuous", lesson: VocabLessonSchema.parse(lesson_obstreperous_impecunious_innocuous) },
  { id: "VocabBibulousCadaverousLugubrious", lesson: VocabLessonSchema.parse(lesson_bibulous_cadaverous_lugubrious) },
];

export const RemotionRoot: FC = () => (
  <>
    {VOCAB.map(({ id, lesson }) => (
      <Composition
        key={id}
        id={id}
        component={VocabLessonComposition}
        schema={VocabLessonPropsSchema}
        durationInFrames={VOCAB_TOTAL_FRAMES}
        fps={VOCAB_FPS}
        width={1080}
        height={1920}
        defaultProps={{ lesson }}
      />
    ))}
  </>
);
