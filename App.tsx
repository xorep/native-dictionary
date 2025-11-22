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

  const [showDetails, setShowDetails] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ---------- Load data ----------
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

  // ---------- Add Word ----------
  const addWord = () => {
    if (!englishInput || !persianInput) return;

    let newId = 587; 
    if (words.length > 0) {
      const maxId = words.reduce((max, word) => {
        const idNum = parseInt(word.id, 10);
        return idNum > max ? idNum : max;
      }, 586);
      newId = maxId + 1;
    }

    const newWord: Word = {
      id: newId.toString(),
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

  // ---------- Delete Word ----------
  const deleteWord = (id: string) => {
    saveWords(words.filter(w => w.id !== id));
  };

  // ---------- Toggle learned ----------
  const toggleLearned = (id: string) => {
    const updated = words.map(w =>
      w.id === id ? { ...w, learned: !w.learned } : w
    );
    saveWords(updated);

    // Update selectedWord for animation
    if (selectedWord?.id === id) {
      setSelectedWord({ ...selectedWord, learned: !selectedWord.learned });
    }
  };

  // ---------- Filter ----------
  const filteredWords = words.filter(word => {
    const matchesSearch =
      word.english.toLowerCase().includes(searchText.toLowerCase()) ||
      word.persian.includes(searchText) ||
      word.id.includes(searchText);

    if (filter === 'learned') return matchesSearch && word.learned;
    if (filter === 'notLearned') return matchesSearch && !word.learned;
    return matchesSearch;
  });

  const totalCount = words.length;
  const learnedCount = words.filter(w => w.learned).length;
  const notLearnedCount = words.filter(w => !w.learned).length;

  // ---------- Open Modal ----------
  const openModal = (word: Word) => {
    const index = words.findIndex(w => w.id === word.id);
    setCurrentIndex(index);
    setSelectedWord(word);
    setDescriptionInput(word.description || '');
    setShowDetails(false);
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

  // ---------- Next / Prev ----------
  const goNext = () => {
    let newIndex = currentIndex < words.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    const newWord = words[newIndex];
    setSelectedWord(newWord);
    setDescriptionInput(newWord.description || '');
  };

  const goPrev = () => {
    let newIndex = currentIndex > 0 ? currentIndex - 1 : words.length - 1;
    setCurrentIndex(newIndex);
    const newWord = words[newIndex];
    setSelectedWord(newWord);
    setDescriptionInput(newWord.description || '');
  };

  // ===========================================================
  // ======================= UI ================================
  // ===========================================================

  return (
    <View style={styles.container}>
      <Text style={styles.title}>لغت‌نامه</Text>

      {/* Search + Add */}
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

      {/* Filter */}
      <View style={styles.filterContainer}>
        <Pressable onPress={() => setFilter('all')} style={[styles.filterButton, filter === 'all' && styles.filterActive]}>
          <Text>همه ({totalCount})</Text>
        </Pressable>

        <Pressable onPress={() => setFilter('learned')} style={[styles.filterButton, filter === 'learned' && styles.filterActive]}>
          <Text>تیک‌دار ({learnedCount})</Text>
        </Pressable>

        <Pressable onPress={() => setFilter('notLearned')} style={[styles.filterButton, filter === 'notLearned' && styles.filterActive]}>
          <Text>بدون تیک ({notLearnedCount})</Text>
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={filteredWords}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.wordItem, item.learned && { opacity: 0.5 }]}>
            <Pressable style={styles.wordTextContainer} onPress={() => openModal(item)}>
              <Text style={styles.ID}>{item.id}. </Text>
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

      {/* ===================== Add Modal ===================== */}
      <Modal transparent visible={addModalVisible} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>افزودن لغت جدید</Text>
            <TextInput placeholder="English" style={styles.input} value={englishInput} onChangeText={setEnglishInput} />
            <TextInput placeholder="Persian" style={styles.input} value={persianInput} onChangeText={setPersianInput} />

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

      {/* ===================== FullScreen Modal ===================== */}
      <Modal transparent={false} visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#fff", padding: 20, marginBottom: 20 ,marginTop: 10}}>
          
          {/* Header + Switch */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            {selectedWord && (
              
              <Switch
                trackColor={{ false: "#ccc", true: "black" }}
                thumbColor={selectedWord.learned ? "#fff" : "#fff"}
                ios_backgroundColor="#ccc"
                value={selectedWord.learned}
                onValueChange={() => toggleLearned(selectedWord.id)}
              />
              
              
            )}

            <Text style={{ fontSize: 26, fontWeight: "bold", textAlign: "center", flex: 1 }}>
               {selectedWord ? `${selectedWord.id}. ${selectedWord.english}` : ""}
            </Text>

            <View style={{ width: 50 }} /> {/* برای تعادل */}
          </View>

          {/* Toggle Details */}
          <Pressable
            onPress={() => setShowDetails(!showDetails)}
            style={{
              backgroundColor: "#444",
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
              alignSelf: "center",
              paddingHorizontal: 20
            }}
          >
            <Text style={{ color: "white" }}>
              {showDetails ? "پنهان کردن" : "نمایش دادن"}
            </Text>
          </Pressable>

          {/* Details */}
          {showDetails && (
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, marginBottom: 10, textAlign: "center" }}>
                {selectedWord ? selectedWord.persian : ""}
              </Text>

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  padding: 10,
                  borderRadius: 8,
                  minHeight: 300,
                  textAlignVertical: "top"
                }}
                multiline
                value={descriptionInput}
                onChangeText={setDescriptionInput}
                placeholder="توضیحات..."
              />
            </View>
          )}
          {!showDetails && (
            <View style={{ flex: 1 }} />
          )}

          {/* Prev - Save - Next */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
            <Pressable
              onPress={goPrev}
              style={{
                backgroundColor: "#007bff",
                padding: 12,
                flex: 1,
                marginRight: 5,
                borderRadius: 8,
                alignItems: "center"
              }}
            >
              <Text style={{ color: "white" }}>قبلی</Text>
            </Pressable>

            <Pressable
              onPress={saveDescription}
              style={{
                backgroundColor: "#28a745",
                padding: 12,
                flex: 1,
                marginHorizontal: 5,
                borderRadius: 8,
                alignItems: "center"
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>ذخیره</Text>
            </Pressable>

            <Pressable
              onPress={goNext}
              style={{
                backgroundColor: "#007bff",
                padding: 12,
                flex: 1,
                marginLeft: 5,
                borderRadius: 8,
                alignItems: "center"
              }}
            >
              <Text style={{ color: "white" }}>بعدی</Text>
            </Pressable>
          </View>

          {/* Close */}
          <Pressable
            onPress={() => setModalVisible(false)}
            style={{
              backgroundColor: "black",
              padding: 12,
              marginTop: 20,
              borderRadius: 8,
              alignItems: "center"
            }}
          >
            <Text style={{ color: "white" }}>بستن</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

// ---------- styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f3f3f3" },
  title: { fontSize: 24, textAlign: "center", marginBottom: 16,marginTop: 14, fontWeight: "bold" },

  searchRow: { flexDirection: "row-reverse", gap: 4, alignItems: "center", marginBottom: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    textAlign: "right",
    color: 'black'
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

  wordItem: { flexDirection: "row", alignItems: "center", backgroundColor: "white", padding: 12, borderRadius: 8, marginBottom: 8 },
  wordTextContainer: { flexDirection: "row", flex: 1, gap: 2 },
  ID: { fontSize: 16, fontWeight: "bold" },
  english: { fontSize: 16, fontWeight: "bold", marginRight: 10 },
  persian: { fontSize: 16, color: "#555" },
  deleteButton: { backgroundColor: "#dc3545", padding: 6, marginLeft: 10, borderRadius: 6 },

  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "white", borderRadius: 10, padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 20, marginBottom: 10 },
  modalText: { fontSize: 16, marginBottom: 10 },

  input: { width: "100%", backgroundColor: "#fff", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", marginBottom: 8 },

  buttonsRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 10, gap: 10 },
  buttonFlex: { flex: 1, alignItems: "center" },

  saveButton: { backgroundColor: "#28a745", paddingVertical: 10, borderRadius: 8 },
  saveButtonText: { color: "white", fontWeight: "bold" },

  closeButton: { backgroundColor: "#007bff", paddingVertical: 10, borderRadius: 8 },
  closeButtonText: { color: "white", fontWeight: "bold" },
});
