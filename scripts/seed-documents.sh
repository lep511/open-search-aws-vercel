#!/bin/bash

API_URL="${1:-https://aws-open-search-vercel.vercel.app}"

echo "Seeding 20 documents to $API_URL/api/index"
echo "-------------------------------------------"

post_doc() {
  local title="$1"
  local content="$2"
  local tags="$3"

  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/index" \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"$title\", \"content\": \"$content\", \"tags\": $tags}")

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "201" ]; then
    echo "[OK] $title"
  else
    echo "[FAIL $http_code] $title - $body"
  fi
}

# Historia
post_doc "The Fall of the Roman Empire" \
  "The decline of the Roman Empire was a gradual process spanning centuries. Economic troubles, military overexpansion, and political instability weakened the once-mighty civilization. Barbarian invasions in the 5th century dealt the final blow to the Western Roman Empire, while the Eastern Byzantine Empire survived until 1453." \
  '["historia", "roma"]'

post_doc "The French Revolution" \
  "The French Revolution of 1789 transformed France from an absolute monarchy to a republic. Driven by widespread inequality, famine, and Enlightenment ideals, citizens stormed the Bastille and overthrew King Louis XVI. The revolution introduced the Declaration of the Rights of Man and fundamentally reshaped European politics." \
  '["historia", "francia"]'

post_doc "The Silk Road and Global Trade" \
  "The Silk Road was a network of ancient trade routes connecting China to the Mediterranean. For over 1,500 years, merchants transported silk, spices, precious metals, and ideas across Central Asia. This exchange fostered cultural diffusion, spread religions like Buddhism and Islam, and laid foundations for modern globalization." \
  '["historia", "comercio"]'

post_doc "The Industrial Revolution" \
  "Beginning in Britain in the late 18th century, the Industrial Revolution transformed agrarian societies into industrial powerhouses. Steam engines, textile mills, and iron production revolutionized manufacturing. Urbanization accelerated as workers migrated to factory cities, fundamentally changing labor, society, and the global economy." \
  '["historia", "tecnologia"]'

# Noticias
post_doc "Advances in Quantum Computing 2026" \
  "Major tech companies have achieved significant breakthroughs in quantum error correction, bringing practical quantum computing closer to reality. New topological qubit designs promise stability at higher temperatures, potentially eliminating the need for extreme cooling systems that have limited deployment." \
  '["noticias", "tecnologia"]'

post_doc "Global Renewable Energy Milestone" \
  "Renewable energy sources now account for over 45 percent of global electricity generation. Solar and wind installations have surpassed coal capacity in major economies. Battery storage technology improvements have addressed intermittency concerns, making clean energy reliable for baseload power generation." \
  '["noticias", "energia"]'

post_doc "Space Exploration Updates" \
  "NASA and international partners have confirmed plans for a permanent lunar research station by 2030. The Artemis program continues delivering crew modules while private companies develop commercial lunar landers. Mars sample return missions are progressing with robotic precursors mapping potential landing sites." \
  '["noticias", "espacio"]'

post_doc "Artificial Intelligence in Healthcare" \
  "AI diagnostic systems are now detecting cancers and cardiovascular conditions with accuracy surpassing human specialists. Hospitals worldwide are adopting machine learning tools for drug discovery, treatment planning, and patient monitoring. Regulatory frameworks are evolving to ensure safety while encouraging innovation." \
  '["noticias", "salud"]'

# Musica
post_doc "The Evolution of Jazz" \
  "Jazz emerged in New Orleans in the early 20th century, blending African rhythms, blues harmonies, and European instrumentation. From Louis Armstrong to Miles Davis and John Coltrane, the genre continuously reinvented itself through swing, bebop, cool jazz, and fusion, influencing virtually every modern music form." \
  '["musica", "jazz"]'

post_doc "Classical Music: The Romantic Era" \
  "The Romantic period in classical music spans roughly 1820 to 1900. Composers like Chopin, Liszt, Wagner, and Tchaikovsky expanded orchestral forces and harmonic language to express intense emotion. The era produced some of the most beloved symphonies, operas, and piano works in the repertoire." \
  '["musica", "clasica"]'

post_doc "The Rise of Electronic Music" \
  "Electronic music evolved from experimental synthesis in the 1960s to dominate global pop culture. Pioneers like Kraftwerk and Brian Eno laid groundwork for house, techno, and ambient genres. Modern producers use digital audio workstations to create complex soundscapes, blurring lines between acoustic and synthetic sound." \
  '["musica", "electronica"]'

post_doc "Latin Music Goes Global" \
  "Latin music has experienced unprecedented global reach in the 2020s. Reggaeton, cumbia, and Latin trap artists consistently top international charts. The fusion of traditional Latin American rhythms with modern production techniques has created a vibrant cross-cultural sound embraced by listeners worldwide." \
  '["musica", "latino"]'

# Literatura
post_doc "Gabriel Garcia Marquez and Magical Realism" \
  "Gabriel Garcia Marquez revolutionized literature with his masterpiece One Hundred Years of Solitude. His magical realism weaves supernatural elements into everyday Latin American life, exploring themes of love, solitude, and cyclical history. The Colombian Nobel laureate inspired generations of writers across languages and continents." \
  '["literatura", "realismo-magico"]'

post_doc "Shakespeare and the English Language" \
  "William Shakespeare invented over 1,700 words still used in English today. His 37 plays and 154 sonnets explore the full range of human experience from jealousy and ambition to love and mortality. Four centuries later, his works remain the most performed and studied in world literature." \
  '["literatura", "teatro"]'

post_doc "The Golden Age of Science Fiction" \
  "The 1940s through 1960s saw science fiction mature as a literary genre. Isaac Asimov, Arthur C. Clarke, and Ray Bradbury explored robotics, space travel, and dystopian futures. Their works predicted technologies like satellites, tablets, and AI while examining humanitys relationship with progress and the unknown." \
  '["literatura", "ciencia-ficcion"]'

post_doc "Jorge Luis Borges and the Infinite Library" \
  "Argentine writer Jorge Luis Borges crafted intricate short stories exploring infinity, labyrinths, mirrors, and time. His Library of Babel imagines a universe-sized library containing every possible book. Borges influenced postmodern literature, philosophy, and mathematics with his elegant explorations of paradox and metaphysics." \
  '["literatura", "filosofia"]'

# Temas mixtos
post_doc "The History of Coffee" \
  "Coffee originated in Ethiopia where legend says a goat herder noticed his animals became energetic after eating coffee berries. The drink spread through the Arab world in the 15th century, reaching Europe by the 17th century. Today coffee is the worlds second most traded commodity after oil." \
  '["historia", "cultura"]'

post_doc "Biodiversity Crisis and Conservation" \
  "Scientists estimate that one million species face extinction due to habitat loss, climate change, and pollution. Conservation efforts including protected areas, wildlife corridors, and captive breeding programs are expanding. Emerging technologies like environmental DNA monitoring help track endangered species in remote ecosystems." \
  '["noticias", "medio-ambiente"]'

post_doc "The Mathematics of Music" \
  "Music and mathematics share deep connections dating to Pythagoras who discovered that harmonious intervals correspond to simple frequency ratios. Modern music theory uses group theory to analyze chord progressions while algorithms compose original pieces. The twelve-tone equal temperament system itself is a mathematical compromise." \
  '["musica", "ciencia"]'

post_doc "Haruki Murakami and Modern Japanese Literature" \
  "Haruki Murakami blends surrealism with mundane reality in novels like Norwegian Wood and Kafka on the Shore. His protagonists navigate loneliness and parallel worlds in contemporary Tokyo. Translated into over 50 languages, Murakami bridges Eastern and Western literary traditions with his unique dreamlike prose." \
  '["literatura", "japon"]'

echo ""
echo "Done! Seeded 20 documents."
