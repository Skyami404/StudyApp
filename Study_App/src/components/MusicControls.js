import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import musicService from '../services/musicService';

export default function MusicControls({ studyMethod, onMusicChange, disabled = false }) {
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [currentMusic, setCurrentMusic] = useState(null);
  const [spotifyAvailable, setSpotifyAvailable] = useState(false);
  const [appleMusicAvailable, setAppleMusicAvailable] = useState(false);
  const [ambientSounds] = useState(musicService.getAmbientSounds());
  const [studyPlaylists] = useState(musicService.getStudyPlaylists());

  useEffect(() => {
    checkMusicServices();
  }, []);

  const checkMusicServices = async () => {
    try {
      const spotify = await musicService.checkSpotifyInstalled();
      const appleMusic = await musicService.checkAppleMusicAvailable();
      setSpotifyAvailable(spotify);
      setAppleMusicAvailable(appleMusic);
    } catch (error) {
      console.log('Error checking music services:', error);
    }
  };

  const handleAmbientSound = async (soundType) => {
    try {
      const result = await musicService.playAmbientSound(soundType);
      if (result.success) {
        setCurrentMusic({ type: 'ambient', sound: soundType });
        onMusicChange && onMusicChange({ type: 'ambient', sound: soundType });
        setShowMusicModal(false);
      } else {
        Alert.alert('Error', 'Failed to play ambient sound');
      }
    } catch (error) {
      console.log('Error playing ambient sound:', error);
      Alert.alert('Error', 'Failed to play ambient sound');
    }
  };

  const handleSpotifyPlaylist = async (playlist) => {
    try {
      const success = await musicService.openSpotify(playlist.id);
      if (success) {
        setCurrentMusic({ type: 'spotify', playlist });
        onMusicChange && onMusicChange({ type: 'spotify', playlist });
        setShowMusicModal(false);
      }
    } catch (error) {
      console.log('Error opening Spotify:', error);
      Alert.alert('Error', 'Failed to open Spotify');
    }
  };

  const handleAppleMusicPlaylist = async (playlist) => {
    try {
      const success = await musicService.openAppleMusic(playlist.id);
      if (success) {
        setCurrentMusic({ type: 'appleMusic', playlist });
        onMusicChange && onMusicChange({ type: 'appleMusic', playlist });
        setShowMusicModal(false);
      }
    } catch (error) {
      console.log('Error opening Apple Music:', error);
      Alert.alert('Error', 'Failed to open Apple Music');
    }
  };

  const stopMusic = async () => {
    try {
      await musicService.stopAmbientSound();
      setCurrentMusic(null);
      onMusicChange && onMusicChange(null);
    } catch (error) {
      console.log('Error stopping music:', error);
    }
  };

  const handleMusicButtonPress = () => {
    if (disabled) {
      Alert.alert(
        'Timer Running',
        'Please pause or stop the timer to change music settings.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowMusicModal(true);
  };

  const renderAmbientSound = ({ item }) => (
    <TouchableOpacity
      style={styles.ambientItem}
      onPress={() => handleAmbientSound(item[0])}
    >
      <Text style={styles.ambientIcon}>{item[1].icon}</Text>
      <Text style={styles.ambientName}>{item[1].name}</Text>
    </TouchableOpacity>
  );

  const renderSpotifyPlaylist = ({ item }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => handleSpotifyPlaylist(item)}
    >
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName}>{item.name}</Text>
        <Text style={styles.playlistDescription}>{item.description}</Text>
      </View>
      <Ionicons name="logo-spotify" size={24} color="#1DB954" />
    </TouchableOpacity>
  );

  const renderAppleMusicPlaylist = ({ item }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => handleAppleMusicPlaylist(item)}
    >
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName}>{item.name}</Text>
        <Text style={styles.playlistDescription}>{item.description}</Text>
      </View>
      <Ionicons name="musical-notes" size={24} color="#FA2C55" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.musicButton,
          disabled && styles.musicButtonDisabled
        ]}
        onPress={handleMusicButtonPress}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <Ionicons 
          name="musical-notes" 
          size={20} 
          color={disabled ? "#666" : "#4A90E2"} 
        />
        <Text style={[
          styles.musicButtonText,
          disabled && styles.musicButtonTextDisabled
        ]}>
          {currentMusic ? 'Change Music' : 'Add Music'}
        </Text>
      </TouchableOpacity>

      {currentMusic && !disabled && (
        <TouchableOpacity 
          style={styles.stopButton} 
          onPress={stopMusic}
          activeOpacity={0.8}
        >
          <Ionicons name="stop" size={16} color="#f44336" />
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>
      )}

      {currentMusic && disabled && (
        <View style={styles.currentMusicInfo}>
          <Text style={styles.currentMusicText}>
            {currentMusic.type === 'ambient' 
              ? `🎵 ${currentMusic.sound}` 
              : `🎵 ${currentMusic.playlist?.name || 'Music'}`
            }
          </Text>
        </View>
      )}

      <Modal visible={showMusicModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Background Music</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMusicModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={Object.entries(ambientSounds)}
              renderItem={renderAmbientSound}
              keyExtractor={(item) => item[0]}
              style={styles.ambientList}
              ListHeaderComponent={
                <Text style={styles.sectionTitle}>🌿 Ambient Sounds</Text>
              }
            />

            {spotifyAvailable && (
              <View style={styles.serviceSection}>
                <Text style={styles.sectionTitle}>🎵 Spotify Playlists</Text>
                <FlatList
                  data={studyPlaylists.spotify}
                  renderItem={renderSpotifyPlaylist}
                  keyExtractor={(item) => item.id}
                  style={styles.playlistList}
                />
              </View>
            )}

            {appleMusicAvailable && (
              <View style={styles.serviceSection}>
                <Text style={styles.sectionTitle}>🎵 Apple Music Playlists</Text>
                <FlatList
                  data={studyPlaylists.appleMusic}
                  renderItem={renderAppleMusicPlaylist}
                  keyExtractor={(item) => item.id}
                  style={styles.playlistList}
                />
              </View>
            )}

            {!spotifyAvailable && !appleMusicAvailable && (
              <View style={styles.noServiceContainer}>
                <Text style={styles.noServiceText}>
                  Install Spotify or Apple Music for playlist integration
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  musicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A90E2',
    gap: 8,
  },
  musicButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#666',
  },
  musicButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  musicButtonTextDisabled: {
    color: '#666',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f44336',
    gap: 4,
  },
  stopButtonText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600',
  },
  currentMusicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  currentMusicText: {
    color: '#212529',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  ambientList: {
    maxHeight: 200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  ambientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  ambientIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  ambientName: {
    fontSize: 16,
    color: '#ffffff',
  },
  serviceSection: {
    marginTop: 20,
  },
  playlistList: {
    maxHeight: 150,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  playlistInfo: {
    flex: 1,
    marginRight: 12,
  },
  playlistName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  playlistDescription: {
    fontSize: 14,
    color: '#999999',
    marginTop: 2,
  },
  noServiceContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noServiceText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
}); 