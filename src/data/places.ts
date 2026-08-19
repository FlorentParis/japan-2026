/**
 * Registre géographique unique : villes, gares, ports, aéroports, arrêts.
 *
 * Toute coordonnée du site vient d'ici. Les trajets référencent des identifiants,
 * jamais des paires de nombres — on ne peut donc pas avoir deux « Okayama »
 * placés à deux endroits différents.
 *
 * Coordonnées en ordre GeoJSON : [longitude, latitude].
 */
import type { Place } from '../types'

const list: Place[] = [
  // ── Kantō ──────────────────────────────────────────────────────────────
  { id: 'tokyo', name: 'Tokyo', nameJa: '東京', kind: 'city', coord: [139.7671, 35.6812] },
  { id: 'shinjuku', name: 'Shinjuku', nameJa: '新宿駅', kind: 'station', coord: [139.7004, 35.6896] },
  { id: 'haneda', name: 'Aéroport de Haneda', nameJa: '羽田空港', kind: 'airport', coord: [139.7798, 35.5494] }, // prettier-ignore

  // Corridor de la ligne Chūō (Shinjuku → Matsumoto)
  { id: 'hachioji', name: 'Hachiōji', kind: 'station', coord: [139.3387, 35.6556] },
  { id: 'otsuki', name: 'Ōtsuki', kind: 'station', coord: [138.9403, 35.6103] },
  { id: 'kofu', name: 'Kōfu', kind: 'station', coord: [138.5690, 35.6673] },
  { id: 'kobuchizawa', name: 'Kobuchizawa', kind: 'station', coord: [138.3230, 35.8650] },
  { id: 'shiojiri', name: 'Shiojiri', kind: 'station', coord: [137.9550, 36.1160] },

  // ── Alpes japonaises ───────────────────────────────────────────────────
  { id: 'matsumoto', name: 'Matsumoto', nameJa: '松本', kind: 'city', coord: [137.9670, 36.2317] },
  { id: 'shin-shimashima', name: 'Shin-Shimashima', nameJa: '新島々', kind: 'station', coord: [137.8550, 36.2030] }, // prettier-ignore
  { id: 'nakanoyu', name: 'Nakanoyu', kind: 'stop', coord: [137.6800, 36.2200] },
  { id: 'kamikochi', name: 'Kamikōchi', nameJa: '上高地', kind: 'landmark', coord: [137.6350, 36.2494] },
  { id: 'hirayu', name: 'Hirayu Onsen', nameJa: '平湯温泉', kind: 'stop', coord: [137.5680, 36.1690] },
  { id: 'hirayu-pass', name: 'Col de Hirayu', kind: 'stop', coord: [137.4000, 36.1500] },
  { id: 'takayama', name: 'Takayama', nameJa: '高山', kind: 'city', coord: [137.2520, 36.1440] },

  // ── Hokuriku ───────────────────────────────────────────────────────────
  { id: 'shirakawago', name: 'Shirakawa-gō', nameJa: '白川郷', kind: 'landmark', coord: [136.9060, 36.2580] }, // prettier-ignore
  { id: 'gokayama', name: 'Vallée de Shōkawa', kind: 'stop', coord: [136.9000, 36.4500] },
  { id: 'fukumitsu', name: 'Fukumitsu', kind: 'stop', coord: [136.7700, 36.5500] },
  { id: 'kanazawa', name: 'Kanazawa', nameJa: '金沢', kind: 'city', coord: [136.6480, 36.5780] },
  { id: 'shin-takaoka', name: 'Shin-Takaoka', kind: 'station', coord: [136.9980, 36.7350] },
  { id: 'toyama', name: 'Toyama', nameJa: '富山', kind: 'city', coord: [137.2130, 36.7010] },

  // ── Route alpine Tateyama-Kurobe (d'ouest en est) ───────────────────────
  { id: 'tateyama-st', name: 'Gare de Tateyama', nameJa: '立山駅', kind: 'station', coord: [137.3130, 36.5850] }, // prettier-ignore
  { id: 'bijodaira', name: 'Bijodaira', nameJa: '美女平', kind: 'stop', coord: [137.3560, 36.5820] },
  { id: 'murodo', name: 'Murodō', nameJa: '室堂', kind: 'landmark', coord: [137.5960, 36.5780] },
  { id: 'daikanbo', name: 'Daikanbō', nameJa: '大観峰', kind: 'stop', coord: [137.6180, 36.5830] },
  { id: 'kurobedaira', name: 'Kurobe-daira', nameJa: '黒部平', kind: 'stop', coord: [137.6400, 36.5760] },
  { id: 'kurobe-dam', name: 'Barrage de Kurobe', nameJa: '黒部ダム', kind: 'landmark', coord: [137.6640, 36.5660] }, // prettier-ignore
  { id: 'ogizawa', name: 'Ōgizawa', nameJa: '扇沢', kind: 'stop', coord: [137.6920, 36.5720] },
  { id: 'shinano-omachi', name: 'Shinano-Ōmachi', nameJa: '信濃大町', kind: 'station', coord: [137.8580, 36.5030] }, // prettier-ignore
  { id: 'hotaka', name: 'Hotaka', kind: 'station', coord: [137.8820, 36.3430] },
  { id: 'shinonoi', name: 'Shinonoi', kind: 'station', coord: [138.1350, 36.5830] },
  { id: 'nagano', name: 'Nagano', nameJa: '長野', kind: 'city', coord: [138.1880, 36.6430] },

  // ── Corridor Nagano → Nagoya (ligne Shinonoi / Chūō-Sai) ────────────────
  { id: 'kiso-fukushima', name: 'Kiso-Fukushima', kind: 'station', coord: [137.6920, 35.8450] },
  { id: 'nakatsugawa', name: 'Nakatsugawa', kind: 'station', coord: [137.5000, 35.4870] },
  { id: 'tajimi', name: 'Tajimi', kind: 'station', coord: [137.1320, 35.3320] },
  { id: 'nagoya', name: 'Nagoya', nameJa: '名古屋', kind: 'station', coord: [136.8815, 35.1709] },

  // ── Corridor Tōkaidō / San'yō ──────────────────────────────────────────
  { id: 'kyoto', name: 'Kyoto', kind: 'station', coord: [135.7580, 34.9850] },
  { id: 'shin-osaka', name: 'Shin-Ōsaka', kind: 'station', coord: [135.5000, 34.7330] },
  { id: 'shin-kobe', name: 'Shin-Kōbe', kind: 'station', coord: [135.1960, 34.7000] },
  { id: 'himeji', name: 'Himeji', kind: 'station', coord: [134.6900, 34.8260] },
  { id: 'okayama', name: 'Okayama', nameJa: '岡山', kind: 'station', coord: [133.9180, 34.6660] },
  { id: 'kurashiki', name: 'Kurashiki', nameJa: '倉敷', kind: 'city', coord: [133.7690, 34.6010] },
  { id: 'shin-kurashiki', name: 'Shin-Kurashiki', kind: 'station', coord: [133.6800, 34.5410] },
  { id: 'fukuyama', name: 'Fukuyama', kind: 'station', coord: [133.3620, 34.4890] },
  { id: 'mihara', name: 'Mihara', kind: 'station', coord: [133.0780, 34.3970] },
  { id: 'higashi-hiroshima', name: 'Higashi-Hiroshima', kind: 'station', coord: [132.7440, 34.4280] },
  { id: 'hiroshima', name: 'Hiroshima', nameJa: '広島', kind: 'city', coord: [132.4750, 34.3980] },
  { id: 'shin-yamaguchi', name: 'Shin-Yamaguchi', kind: 'station', coord: [131.3950, 34.0940] },
  { id: 'shin-shimonoseki', name: 'Shin-Shimonoseki', kind: 'station', coord: [130.9680, 33.9830] },
  { id: 'kokura', name: 'Kokura', kind: 'station', coord: [130.8820, 33.8860] },

  // ── Mer intérieure de Seto ─────────────────────────────────────────────
  { id: 'chayamachi', name: 'Chayamachi', kind: 'station', coord: [133.8770, 34.5860] },
  { id: 'uno', name: 'Port d’Uno', nameJa: '宇野港', kind: 'port', coord: [133.9490, 34.4880] },
  { id: 'miyanoura', name: 'Miyanoura (Naoshima)', nameJa: '宮浦港', kind: 'port', coord: [133.9930, 34.4610] }, // prettier-ignore
  { id: 'naoshima', name: 'Naoshima', nameJa: '直島', kind: 'city', coord: [133.9970, 34.4560] },
  { id: 'takamatsu-port', name: 'Port de Takamatsu', kind: 'port', coord: [134.0480, 34.3540] },
  { id: 'takamatsu', name: 'Takamatsu', nameJa: '高松', kind: 'city', coord: [134.0470, 34.3500] },
  { id: 'sakaide', name: 'Sakaide', kind: 'station', coord: [133.8590, 34.3220] },
  { id: 'seto-ohashi', name: 'Pont de Seto', nameJa: '瀬戸大橋', kind: 'landmark', coord: [133.8100, 34.4300] }, // prettier-ignore

  // ── Shikoku : corridor de la ligne Yosan (Takamatsu ⇄ Matsuyama) ─────────
  { id: 'tadotsu', name: 'Tadotsu', kind: 'station', coord: [133.7550, 34.2735] },
  { id: 'kanonji', name: 'Kan’onji', kind: 'station', coord: [133.6600, 34.1265] },
  { id: 'iyo-saijo', name: 'Iyo-Saijō', kind: 'station', coord: [133.1810, 33.9195] },
  { id: 'imabari', name: 'Imabari', nameJa: '今治', kind: 'station', coord: [132.9950, 34.0640] },
  { id: 'iyo-hojo', name: 'Iyo-Hōjō', kind: 'station', coord: [132.7770, 33.9660] },
  { id: 'matsuyama', name: 'Matsuyama', nameJa: '松山', kind: 'city', coord: [132.7657, 33.8416] },
  { id: 'matsuyama-st', name: 'Gare de Matsuyama', nameJa: '松山駅', kind: 'station', coord: [132.7648, 33.8391] }, // prettier-ignore

  // ── Kyūshū ─────────────────────────────────────────────────────────────
  { id: 'fukuoka', name: 'Fukuoka', nameJa: '福岡', kind: 'city', coord: [130.4017, 33.5902] },
  { id: 'hakata', name: 'Hakata', nameJa: '博多駅', kind: 'station', coord: [130.4200, 33.5900] },
  { id: 'tosu', name: 'Shin-Tosu', kind: 'station', coord: [130.5080, 33.3770] },
  { id: 'saga', name: 'Saga', kind: 'station', coord: [130.3010, 33.2640] },
  { id: 'takeo-onsen', name: 'Takeo-Onsen', nameJa: '武雄温泉', kind: 'station', coord: [130.0210, 33.1930] }, // prettier-ignore
  { id: 'ureshino', name: 'Ureshino-Onsen', kind: 'station', coord: [129.9810, 33.1040] },
  { id: 'shin-omura', name: 'Shin-Ōmura', kind: 'station', coord: [129.9580, 32.9300] },
  { id: 'isahaya', name: 'Isahaya', kind: 'station', coord: [130.0550, 32.8450] },
  { id: 'nagasaki', name: 'Nagasaki', nameJa: '長崎', kind: 'city', coord: [129.8720, 32.7530] },
  { id: 'nagasaki-airport', name: 'Aéroport de Nagasaki', nameJa: '長崎空港', kind: 'airport', coord: [129.9137, 32.9169] }, // prettier-ignore
]

export const PLACES: Record<string, Place> = Object.fromEntries(
  list.map((p) => [p.id, p]),
)

/** Accès sûr : une faute de frappe sur un identifiant doit crier, pas produire un trou. */
export function place(id: string): Place {
  const found = PLACES[id]
  if (!found) throw new Error(`Place inconnue : « ${id} » (voir src/data/places.ts)`)
  return found
}
