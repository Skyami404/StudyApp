import { Platform, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { Audio } from 'expo-av';

class MusicService {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.5;
    this.sound = null;
    this.ambientSounds = {
      rain: { 
        name: 'Rain', 
        icon: '🌧️', 
        duration: 'continuous'
      },
      whiteNoise: { 
        name: 'White Noise', 
        icon: '🔊', 
        duration: 'continuous'
      },
      forest: { 
        name: 'Forest', 
        icon: '🌲', 
        duration: 'continuous'
      },
      ocean: { 
        name: 'Ocean Waves', 
        icon: '🌊', 
        duration: 'continuous'
      },
      cafe: { 
        name: 'Cafe Ambience', 
        icon: '☕', 
        duration: 'continuous'
      },
      fireplace: { 
        name: 'Fireplace', 
        icon: '🔥', 
        duration: 'continuous'
      },
    };
  }

  // Initialize audio
  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  // Check if Spotify is installed
  async checkSpotifyInstalled() {
    try {
      const canOpen = await Linking.canOpenURL('spotify:');
      return canOpen;
    } catch (error) {
      console.log('Error checking Spotify:', error);
      return false;
    }
  }

  // Check if Apple Music is available
  async checkAppleMusicAvailable() {
    try {
      const canOpen = await Linking.canOpenURL('music:');
      return canOpen;
    } catch (error) {
      console.log('Error checking Apple Music:', error);
      return false;
    }
  }

  // Open Spotify with a specific playlist/album
  async openSpotify(playlistId = null) {
    try {
      let url = 'spotify:';
      if (playlistId) {
        url = `spotify:playlist:${playlistId}`;
      }
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.log('Error opening Spotify:', error);
      Alert.alert('Error', 'Could not open Spotify. Please make sure it\'s installed.');
      return false;
    }
  }

  // Open Apple Music with a specific playlist/album
  async openAppleMusic(playlistId = null) {
    try {
      let url = 'music:';
      if (playlistId) {
        url = `music://music.apple.com/playlist/${playlistId}`;
      }
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.log('Error opening Apple Music:', error);
      Alert.alert('Error', 'Could not open Apple Music.');
      return false;
    }
  }

  // Get recommended study playlists
  getStudyPlaylists() {
    return {
      spotify: [
        { id: '37i9dQZF1DX8Uebhn9BzIx', name: 'Deep Focus', description: 'Instrumental music for deep work' },
        { id: '37i9dQZF1DX3s9uCz6JjGf', name: 'Peaceful Piano', description: 'Calm piano music for studying' },
        { id: '37i9dQZF1DX8NTLI2TtZa6', name: 'Intense Studying', description: 'High-energy focus music' },
        { id: '37i9dQZF1DX5Vy6DFOcx00', name: 'Lo-Fi Beats', description: 'Chill beats for studying' },
      ],
      appleMusic: [
        { id: 'pl.acc464c750054d26b5c273d6c73c8b8c', name: 'Deep Focus', description: 'Instrumental music for deep work' },
        { id: 'pl.acc464c750054d26b5c273d6c73c8b8d', name: 'Peaceful Piano', description: 'Calm piano music for studying' },
        { id: 'pl.acc464c750054d26b5c273d6c73c8b8e', name: 'Intense Studying', description: 'High-energy focus music' },
        { id: 'pl.acc464c750054d26b5c273d6c73c8b8f', name: 'Lo-Fi Beats', description: 'Chill beats for studying' },
      ]
    };
  }

  // Get ambient sounds
  getAmbientSounds() {
    return this.ambientSounds;
  }

  // Play ambient sound (placeholder implementation)
  async playAmbientSound(soundType) {
    try {
      // Stop any currently playing sound
      await this.stopAmbientSound();
      
      const soundConfig = this.ambientSounds[soundType];
      if (!soundConfig) {
        throw new Error(`Unknown sound type: ${soundType}`);
      }

      console.log(`Playing ambient sound: ${soundType}`);
      
      // For now, this is a placeholder since we don't have actual audio files
      // In a real implementation, you would load and play actual audio files
      this.isPlaying = true;
      this.currentTrack = { type: 'ambient', sound: soundType };
      
      console.log(`Ambient sound ${soundType} started playing (placeholder)`);
      return { success: true, sound: soundType };
    } catch (error) {
      console.error('Error playing ambient sound:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop ambient sound
  async stopAmbientSound() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.isPlaying = false;
      this.currentTrack = null;
      console.log('Ambient sound stopped');
      return { success: true };
    } catch (error) {
      console.error('Error stopping ambient sound:', error);
      this.isPlaying = false;
      this.currentTrack = null;
      return { success: true };
    }
  }

  // Control system music playback
  async controlSystemMusic(action) {
    try {
      switch (action) {
        case 'play':
          await Linking.openURL('music://play');
          break;
        case 'pause':
          await Linking.openURL('music://pause');
          break;
        case 'next':
          await Linking.openURL('music://next');
          break;
        case 'previous':
          await Linking.openURL('music://previous');
          break;
        default:
          console.log('Unknown music action:', action);
      }
      return { success: true };
    } catch (error) {
      console.log('Error controlling system music:', error);
      return { success: false, error: error.message };
    }
  }

  // Get music recommendations based on study method
  getMusicRecommendations(studyMethod) {
    const recommendations = {
      pomodoro: {
        description: 'Short, energetic tracks for focused bursts',
        spotify: '37i9dQZF1DX8NTLI2TtZa6', // Intense Studying
        appleMusic: 'pl.acc464c750054d26b5c273d6c73c8b8e'
      },
      focus: {
        description: 'Medium-length instrumental tracks',
        spotify: '37i9dQZF1DX8Uebhn9BzIx', // Deep Focus
        appleMusic: 'pl.acc464c750054d26b5c273d6c73c8b8c'
      },
      deepwork: {
        description: 'Long, ambient tracks for extended sessions',
        spotify: '37i9dQZF1DX3s9uCz6JjGf', // Peaceful Piano
        appleMusic: 'pl.acc464c750054d26b5c273d6c73c8b8d'
      }
    };
    return recommendations[studyMethod] || recommendations.focus;
  }
}

// Create singleton instance
const musicService = new MusicService();

export default musicService; 