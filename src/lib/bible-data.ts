export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

export interface BibleBook {
  name: string;
  chapters: number;
  testament: 'old' | 'new';
}

export interface Note {
  id: string;
  reference: string;
  text: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  icon: string;
}

export const bibleBooks: BibleBook[] = [
  { name: "Gênesis", chapters: 50, testament: "old" },
  { name: "Êxodo", chapters: 40, testament: "old" },
  { name: "Levítico", chapters: 27, testament: "old" },
  { name: "Números", chapters: 36, testament: "old" },
  { name: "Deuteronômio", chapters: 34, testament: "old" },
  { name: "Josué", chapters: 24, testament: "old" },
  { name: "Juízes", chapters: 21, testament: "old" },
  { name: "Rute", chapters: 4, testament: "old" },
  { name: "1 Samuel", chapters: 31, testament: "old" },
  { name: "2 Samuel", chapters: 24, testament: "old" },
  { name: "1 Reis", chapters: 22, testament: "old" },
  { name: "2 Reis", chapters: 25, testament: "old" },
  { name: "1 Crônicas", chapters: 29, testament: "old" },
  { name: "2 Crônicas", chapters: 36, testament: "old" },
  { name: "Esdras", chapters: 10, testament: "old" },
  { name: "Neemias", chapters: 13, testament: "old" },
  { name: "Ester", chapters: 10, testament: "old" },
  { name: "Jó", chapters: 42, testament: "old" },
  { name: "Salmos", chapters: 150, testament: "old" },
  { name: "Provérbios", chapters: 31, testament: "old" },
  { name: "Eclesiastes", chapters: 12, testament: "old" },
  { name: "Cantares", chapters: 8, testament: "old" },
  { name: "Isaías", chapters: 66, testament: "old" },
  { name: "Jeremias", chapters: 52, testament: "old" },
  { name: "Lamentações", chapters: 5, testament: "old" },
  { name: "Ezequiel", chapters: 48, testament: "old" },
  { name: "Daniel", chapters: 12, testament: "old" },
  { name: "Oséias", chapters: 14, testament: "old" },
  { name: "Joel", chapters: 3, testament: "old" },
  { name: "Amós", chapters: 9, testament: "old" },
  { name: "Obadias", chapters: 1, testament: "old" },
  { name: "Jonas", chapters: 4, testament: "old" },
  { name: "Miquéias", chapters: 7, testament: "old" },
  { name: "Naum", chapters: 3, testament: "old" },
  { name: "Habacuque", chapters: 3, testament: "old" },
  { name: "Sofonias", chapters: 3, testament: "old" },
  { name: "Ageu", chapters: 2, testament: "old" },
  { name: "Zacarias", chapters: 14, testament: "old" },
  { name: "Malaquias", chapters: 4, testament: "old" },
  { name: "Mateus", chapters: 28, testament: "new" },
  { name: "Marcos", chapters: 16, testament: "new" },
  { name: "Lucas", chapters: 24, testament: "new" },
  { name: "João", chapters: 21, testament: "new" },
  { name: "Atos", chapters: 28, testament: "new" },
  { name: "Romanos", chapters: 16, testament: "new" },
  { name: "1 Coríntios", chapters: 16, testament: "new" },
  { name: "2 Coríntios", chapters: 13, testament: "new" },
  { name: "Gálatas", chapters: 6, testament: "new" },
  { name: "Efésios", chapters: 6, testament: "new" },
  { name: "Filipenses", chapters: 4, testament: "new" },
  { name: "Colossenses", chapters: 4, testament: "new" },
  { name: "1 Tessalonicenses", chapters: 5, testament: "new" },
  { name: "2 Tessalonicenses", chapters: 3, testament: "new" },
  { name: "1 Timóteo", chapters: 6, testament: "new" },
  { name: "2 Timóteo", chapters: 4, testament: "new" },
  { name: "Tito", chapters: 3, testament: "new" },
  { name: "Filemom", chapters: 1, testament: "new" },
  { name: "Hebreus", chapters: 13, testament: "new" },
  { name: "Tiago", chapters: 5, testament: "new" },
  { name: "1 Pedro", chapters: 5, testament: "new" },
  { name: "2 Pedro", chapters: 3, testament: "new" },
  { name: "1 João", chapters: 5, testament: "new" },
  { name: "2 João", chapters: 1, testament: "new" },
  { name: "3 João", chapters: 1, testament: "new" },
  { name: "Judas", chapters: 1, testament: "new" },
  { name: "Apocalipse", chapters: 22, testament: "new" },
];

export const dailyVerses: BibleVerse[] = [
  { book: "Salmos", chapter: 23, verse: 1, text: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
  { book: "João", chapter: 3, verse: 16, text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", reference: "João 3:16" },
  { book: "Filipenses", chapter: 4, verse: 13, text: "Posso todas as coisas naquele que me fortalece.", reference: "Filipenses 4:13" },
  { book: "Provérbios", chapter: 3, verse: 5, text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", reference: "Provérbios 3:5" },
  { book: "Isaías", chapter: 41, verse: 10, text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.", reference: "Isaías 41:10" },
  { book: "Romanos", chapter: 8, verse: 28, text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.", reference: "Romanos 8:28" },
  { book: "Mateus", chapter: 11, verse: 28, text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11:28" },
  { book: "Jeremias", chapter: 29, verse: 11, text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais.", reference: "Jeremias 29:11" },
  { book: "Salmos", chapter: 91, verse: 1, text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.", reference: "Salmos 91:1" },
  { book: "Josué", chapter: 1, verse: 9, text: "Não to mandei eu? Esforça-te e tem bom ânimo; não pasmes, nem te espantes, porque o Senhor, teu Deus, é contigo, por onde quer que andares.", reference: "Josué 1:9" },
  { book: "Salmos", chapter: 119, verse: 105, text: "Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.", reference: "Salmos 119:105" },
  { book: "2 Timóteo", chapter: 1, verse: 7, text: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.", reference: "2 Timóteo 1:7" },
  { book: "Salmos", chapter: 46, verse: 1, text: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", reference: "Salmos 46:1" },
  { book: "Gálatas", chapter: 5, verse: 22, text: "Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança.", reference: "Gálatas 5:22" },
  { book: "Efésios", chapter: 2, verse: 8, text: "Porque pela graça sois salvos, por meio da fé; e isso não vem de vós; é dom de Deus.", reference: "Efésios 2:8" },
  { book: "1 Coríntios", chapter: 13, verse: 4, text: "O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com leviandade, não se ensoberbece.", reference: "1 Coríntios 13:4" },
  { book: "Salmos", chapter: 37, verse: 4, text: "Deleita-te também no Senhor, e ele te concederá o que deseja o teu coração.", reference: "Salmos 37:4" },
  { book: "Hebreus", chapter: 11, verse: 1, text: "Ora, a fé é o firme fundamento das coisas que se esperam e a prova das coisas que se não veem.", reference: "Hebreus 11:1" },
  { book: "Mateus", chapter: 6, verse: 33, text: "Mas buscai primeiro o Reino de Deus, e a sua justiça, e todas essas coisas vos serão acrescentadas.", reference: "Mateus 6:33" },
  { book: "Salmos", chapter: 27, verse: 1, text: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?", reference: "Salmos 27:1" },
  { book: "Romanos", chapter: 12, verse: 2, text: "E não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento.", reference: "Romanos 12:2" },
  { book: "Tiago", chapter: 1, verse: 2, text: "Meus irmãos, tende grande gozo quando cairdes em várias tentações.", reference: "Tiago 1:2" },
  { book: "Colossenses", chapter: 3, verse: 23, text: "E, tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor e não aos homens.", reference: "Colossenses 3:23" },
  { book: "1 Pedro", chapter: 5, verse: 7, text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", reference: "1 Pedro 5:7" },
  { book: "Salmos", chapter: 34, verse: 8, text: "Provai e vede que o Senhor é bom; bem-aventurado o homem que nele confia.", reference: "Salmos 34:8" },
  { book: "Provérbios", chapter: 16, verse: 3, text: "Confia ao Senhor as tuas obras, e teus pensamentos serão estabelecidos.", reference: "Provérbios 16:3" },
  { book: "João", chapter: 14, verse: 6, text: "Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por mim.", reference: "João 14:6" },
  { book: "Apocalipse", chapter: 21, verse: 4, text: "E Deus limpará de seus olhos toda lágrima, e não haverá mais morte, nem pranto, nem clamor, nem dor.", reference: "Apocalipse 21:4" },
  { book: "Salmos", chapter: 121, verse: 1, text: "Levantarei os meus olhos para os montes, de onde vem o meu socorro.", reference: "Salmos 121:1" },
  { book: "Isaías", chapter: 40, verse: 31, text: "Mas os que esperam no Senhor renovarão as suas forças, subirão com asas como águias.", reference: "Isaías 40:31" },
  { book: "Salmos", chapter: 150, verse: 6, text: "Tudo quanto tem fôlego louve ao Senhor. Louvai ao Senhor!", reference: "Salmos 150:6" },
];

export const defaultGroups: Group[] = [
  { id: "1", name: "Estudo Bíblico Diário", description: "Grupo para estudo diário da Palavra", members: 128, icon: "📖" },
  { id: "2", name: "Oração e Intercessão", description: "Compartilhe pedidos de oração", members: 256, icon: "🙏" },
  { id: "3", name: "Jovens na Fé", description: "Comunidade para jovens cristãos", members: 89, icon: "⭐" },
  { id: "4", name: "Louvor e Adoração", description: "Para amantes da música gospel", members: 345, icon: "🎵" },
  { id: "5", name: "Famílias Abençoadas", description: "Fortalecendo famílias pela Palavra", members: 167, icon: "❤️" },
  { id: "6", name: "Missões e Evangelismo", description: "Compartilhando o amor de Cristo", members: 203, icon: "🌍" },
];

export function getDailyVerse(): BibleVerse {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return dailyVerses[dayOfYear % dailyVerses.length];
}

export function getFavorites(): BibleVerse[] {
  const stored = localStorage.getItem("bible-favorites");
  return stored ? JSON.parse(stored) : [];
}

export function toggleFavorite(verse: BibleVerse): boolean {
  const favorites = getFavorites();
  const index = favorites.findIndex(
    (f) => f.reference === verse.reference
  );
  if (index >= 0) {
    favorites.splice(index, 1);
    localStorage.setItem("bible-favorites", JSON.stringify(favorites));
    return false;
  } else {
    favorites.push(verse);
    localStorage.setItem("bible-favorites", JSON.stringify(favorites));
    return true;
  }
}

export function isFavorite(reference: string): boolean {
  const favorites = getFavorites();
  return favorites.some((f) => f.reference === reference);
}

export function getNotes(): Note[] {
  const stored = localStorage.getItem("bible-notes");
  return stored ? JSON.parse(stored) : [];
}

export function addNote(reference: string, text: string): Note {
  const notes = getNotes();
  const note: Note = {
    id: Date.now().toString(),
    reference,
    text,
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  localStorage.setItem("bible-notes", JSON.stringify(notes));
  return note;
}

export function deleteNote(id: string): void {
  const notes = getNotes().filter((n) => n.id !== id);
  localStorage.setItem("bible-notes", JSON.stringify(notes));
}

export function getReadingHistory(): string[] {
  const stored = localStorage.getItem("bible-reading-history");
  return stored ? JSON.parse(stored) : [];
}

export function addToReadingHistory(reference: string): void {
  const history = getReadingHistory();
  const filtered = history.filter((h) => h !== reference);
  filtered.unshift(reference);
  localStorage.setItem("bible-reading-history", JSON.stringify(filtered.slice(0, 50)));
}
