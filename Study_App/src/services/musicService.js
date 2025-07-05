import { Platform, Alert } from 'react-native';
import * as Linking from 'expo-linking';

class MusicService {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.5;
    this.ambientSounds = {
      rain: { name: 'Rain', icon: '🌧️', duration: 'continuous' },
      whiteNoise: { name: 'White Noise', icon: '🔊', duration: 'continuous' },
      forest: { name: 'Forest', icon: '🌲', duration: 'continuous' },
      ocean: { name: 'Ocean Waves', icon: '🌊', duration: 'continuous' },
      cafe: { name: 'Cafe Ambience', icon: '☕', duration: 'continuous' },
      fireplace: { name: 'Fireplace', icon: '🔥', duration: 'continuous' },
    };
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

  // Play ambient sound (placeholder - would need audio library)
  async playAmbientSound(soundType) {
    try {
      console.log(`Playing ambient sound: ${soundType}`);
      // This would integrate with expo-av or react-native-sound
      // For now, just return success
      return { success: true, sound: soundType };
    } catch (error) {
      console.log('Error playing ambient sound:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop ambient sound
  async stopAmbientSound() {
    try {
      console.log('Stopping ambient sound');
      // This would stop the audio
      return { success: true };
    } catch (error) {
      console.log('Error stopping ambient sound:', error);
      return { success: false, error: error.message };
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