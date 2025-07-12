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
  ScrollView,
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
    // Initialize music service
    musicService.initialize();
    checkMusicServices();
    
    // Cleanup on unmount
    return () => {
      musicService.cleanup();
    };
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
    console.log('handleAmbientSound called with:', soundType);
    
    try {
      const result = await musicService.playAmbientSound(soundType);
      console.log('Music service result:', result);
      
      if (result.success) {
        setCurrentMusic({ type: 'ambient', sound: soundType });
        onMusicChange && onMusicChange({ type: 'ambient', sound: soundType });
        setShowMusicModal(false);
        
        // The music service now shows its own alert, so we don't need to show another one
        console.log('Music selection successful');
      } else {
        Alert.alert('Error', `Failed to play ${soundType} sound: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('Error playing ambient sound:', error);
      Alert.alert('Error', `Failed to play ${soundType} sound: ${error.message}`);
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

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Ambient Sounds Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>🌿 Ambient Sounds</Text>
                <View style={styles.ambientGrid}>
                  {Object.entries(ambientSounds).map(([key, sound]) => (
                    <TouchableOpacity
                      key={key}
                      style={styles.ambientItem}
                      onPress={() => handleAmbientSound(key)}
                      activeOpacity={0.5}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.ambientIcon}>{sound.icon}</Text>
                      <Text style={styles.ambientName}>{sound.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Spotify Section */}
              {spotifyAvailable && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>🎵 Spotify Playlists</Text>
                  <View style={styles.playlistContainer}>
                    {studyPlaylists.spotify.map((playlist) => (
                      <TouchableOpacity
                        key={playlist.id}
                        style={styles.playlistItem}
                        onPress={() => handleSpotifyPlaylist(playlist)}
                        activeOpacity={0.5}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <View style={styles.playlistInfo}>
                          <Text style={styles.playlistName}>{playlist.name}</Text>
                          <Text style={styles.playlistDescription}>{playlist.description}</Text>
                        </View>
                        <Ionicons name="logo-spotify" size={24} color="#1DB954" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Apple Music Section */}
              {appleMusicAvailable && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>🎵 Apple Music Playlists</Text>
                  <View style={styles.playlistContainer}>
                    {studyPlaylists.appleMusic.map((playlist) => (
                      <TouchableOpacity
                        key={playlist.id}
                        style={styles.playlistItem}
                        onPress={() => handleAppleMusicPlaylist(playlist)}
                        activeOpacity={0.5}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <View style={styles.playlistInfo}>
                          <Text style={styles.playlistName}>{playlist.name}</Text>
                          <Text style={styles.playlistDescription}>{playlist.description}</Text>
                        </View>
                        <Ionicons name="musical-notes" size={24} color="#FA2C55" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* No Services Available */}
              {!spotifyAvailable && !appleMusicAvailable && (
                <View style={styles.noServiceContainer}>
                  <Text style={styles.noServiceText}>
                    Install Spotify or Apple Music for playlist integration
                  </Text>
                </View>
              )}
            </ScrollView>
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
  modalContent: {
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  ambientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 10,
  },
  ambientItem: {
    width: '45%', // Make items larger and easier to tap
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 80, // Ensure minimum touchable area
  },
  ambientIcon: {
    fontSize: 24,
    marginBottom: 5,
    color: '#4A90E2',
  },
  ambientName: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  playlistContainer: {
    maxHeight: 150, // Limit height for scrollable list
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
  },
  playlistInfo: {
    flex: 1,
    marginRight: 10,
  },
  playlistName: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  playlistDescription: {
    fontSize: 12,
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