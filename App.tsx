// --- imports ---
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Switch,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db from "./db.json";

type Word = {
  id: string;
  english: string;
  persian: string;
  learned: boolean;
  description?: string;
};

type FilterType = 'all' | 'learned' | 'notLearned';

export default function App() {
  const [words, setWords] = useState<Word[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [descriptionInput, setDescriptionInput] = useState('');

  const [englishInput, setEnglishInput] = useState('');
  const [persianInput, setPersianInput] = useState('');

  // بارگذاری لغات از db.json یا ذخیره
  useEffect(() => {
    const loadWords = async () => {
      const savedWords = await AsyncStorage.getItem('@words');

      if (savedWords) {
        setWords(JSON.parse(savedWords));
        
      } else {
        setWords(db);
        await AsyncStorage.setItem('@words', JSON.stringify(db));
      }
    };
    loadWords();
  }, []);

  const saveWords = async (newWords: Word[]) => {
    setWords(newWords);
    await AsyncStorage.setItem('@words', JSON.stringify(newWords));
  };

  const addWord = () => {
    if (!englishInput || !persianInput) return;

    const newWord: Word = {
      id: Date.now().toString(),
      english: englishInput,
      persian: persianInput,
      learned: false,
      description: '',
    };

    saveWords([newWord, ...words]);
    setEnglishInput('');
    setPersianInput('');
    setAddModalVisible(false);
  };

  const deleteWord = (id: string) => {
    saveWords(words.filter(w => w.id !== id));
  };

  const toggleLearned = (id: string) => {
    const updated = words.map(w =>
      w.id === id ? { ...w, learned: !w.learned } : w
    );
    saveWords(updated);
  };

  const filteredWords = words.filter(word => {
    const matchesSearch =
      word.english.toLowerCase().includes(searchText.toLowerCase()) ||
      word.persian.includes(searchText);

    if (filter === 'learned') return matchesSearch && word.learned;
    if (filter === 'notLearned') return matchesSearch && !word.learned;
    return matchesSearch;
  });

  // --- شمارش‌ها ---
  const totalCount = words.length;
  const learnedCount = words.filter(w => w.learned).length;
  const notLearnedCount = words.filter(w => !w.learned).length;

  const openModal = (word: Word) => {
    setSelectedWord(word);
    setDescriptionInput(word.description || '');
    setModalVisible(true);
  };

  const saveDescription = () => {
    if (!selectedWord) return;

    const updated = words.map(word =>
      word.id === selectedWord.id ? { ...word, description: descriptionInput } : word
    );

    saveWords(updated);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>لغت‌نامه</Text>

      {/* سرچ + افزودن */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="...جستجو"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />

        <Pressable onPress={() => setAddModalVisible(true)} style={styles.addIcon}>
          <Text style={{ fontSize: 22, color: "white" }}>＋</Text>
        </Pressable>
      </View>

      {/* فیلتر + تعداد */}
      <View style={styles.filterContainer}>
        <Pressable
          onPress={() => setFilter('all')}
          style={[styles.filterButton, filter === 'all' && styles.filterActive]}
        >
          <Text>همه ({totalCount})</Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('learned')}
          style={[styles.filterButton, filter === 'learned' && styles.filterActive]}
        >
          <Text>تیک‌دار ({learnedCount})</Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('notLearned')}
          style={[styles.filterButton, filter === 'notLearned' && styles.filterActive]}
        >
          <Text>بدون تیک ({notLearnedCount})</Text>
        </Pressable>
      </View>

      {/* لیست لغات */}
      <FlatList
        data={filteredWords}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.wordItem, item.learned && { opacity: 0.5 }]}>
            <Pressable style={styles.wordTextContainer} onPress={() => openModal(item)}>
              <Text style={styles.english}>{item.english}</Text>
              <Text style={styles.persian}>{item.persian}</Text>
            </Pressable>

            <Switch
              trackColor={{ false: "#ccc", true: "black" }}
              thumbColor="#fff"
              value={item.learned}
              onValueChange={() => toggleLearned(item.id)}
            />

            <Pressable onPress={() => deleteWord(item.id)} style={styles.deleteButton}>
              <Text style={{ color: "white" }}>Delete</Text>
            </Pressable>
          </View>
        )}
      />

      {/* مودال افزودن لغت */}
      <Modal transparent visible={addModalVisible} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>افزودن لغت جدید</Text>

            <TextInput
              placeholder="English"
              style={styles.input}
              value={englishInput}
              onChangeText={setEnglishInput}
            />

            <TextInput
              placeholder="Persian"
              style={styles.input}
              value={persianInput}
              onChangeText={setPersianInput}
            />

            <View style={styles.buttonsRow}>
              <Pressable style={[styles.saveButton, styles.buttonFlex]} onPress={addWord}>
                <Text style={styles.saveButtonText}>افزودن</Text>
              </Pressable>

              <Pressable style={[styles.closeButton, styles.buttonFlex]} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.closeButtonText}>بستن</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال توضیحات */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedWord?.english}</Text>
            <Text style={styles.modalText}>{selectedWord?.persian}</Text>

            <TextInput
              style={styles.descriptionInput}
              value={descriptionInput}
              onChangeText={setDescriptionInput}
              multiline
              placeholder="توضیحات..."
            />

            <View style={styles.buttonsRow}>
              <Pressable onPress={saveDescription} style={[styles.saveButton, styles.buttonFlex]}>
                <Text style={styles.saveButtonText}>ذخیره</Text>
              </Pressable>

              <Pressable onPress={() => setModalVisible(false)} style={[styles.closeButton, styles.buttonFlex]}>
                <Text style={styles.closeButtonText}>بستن</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- styles ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f3f3f3" },
  title: { fontSize: 24, textAlign: "center", marginBottom: 16, fontWeight: "bold" },

  searchRow: { flexDirection: "row-reverse", gap: 4, alignItems: "center", marginBottom: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    textAlign: "right",
    color: '#000'
  },
  addIcon: {
    marginLeft: 8,
    backgroundColor: "#007bff",
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  filterContainer: { flexDirection: "row-reverse", justifyContent: "space-around", marginBottom: 12 },
  filterButton: { padding: 8, backgroundColor: "#ddd", borderRadius: 8 },
  filterActive: { backgroundColor: "#007bff" },

  wordItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  wordTextContainer: { flexDirection: "row", flex: 1 ,gap:2},
  english: { fontSize: 16, fontWeight: "bold", marginRight: 10 },
  persian: { fontSize: 16, color: "#555" },
  deleteButton: { backgroundColor: "#dc3545", padding: 6,marginLeft: 10 , borderRadius: 6 },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, marginBottom: 10 },
  modalText: { fontSize: 16, marginBottom: 10 },

  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 8,
  },

  descriptionInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 10,
  },

  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    gap: 10,
  },
  buttonFlex: { flex: 1, alignItems: "center" },

  saveButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: { color: "white", fontWeight: "bold" },

  closeButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: { color: "white", fontWeight: "bold" },
});
