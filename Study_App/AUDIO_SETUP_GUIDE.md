# Audio Setup Guide

This guide explains how to add real audio files to your Study App.

## Current Status: Simulation Mode

Right now, the app is in **simulation mode**, which means:
- ✅ Music selection works
- ✅ UI responds correctly
- ❌ No actual sound plays
- ❌ No audio files are loaded

## How to Add Real Audio Files

### Option 1: Local Audio Files (Recommended)

1. **Create an audio folder:**
   ```
   Study_App/assets/audio/
   ```

2. **Add your audio files:**
   ```
   Study_App/assets/audio/
   ├── rain.mp3
   ├── whiteNoise.mp3
   ├── forest.mp3
   ├── ocean.mp3
   ├── cafe.mp3
   └── fireplace.mp3
   ```

3. **Update the music service:**
   In `src/services/musicService.js`, replace the simulation code with:
   ```javascript
   // Load and play actual audio file
   const { sound } = await Audio.Sound.createAsync(
     require(`../../assets/audio/${soundType}.mp3`),
     { 
       shouldPlay: true,
       isLooping: true,
       volume: this.volume,
       rate: 1.0,
     }
   );
   ```

### Option 2: Remote Audio URLs

1. **Find reliable audio URLs** (replace the current ones):
   ```javascript
   this.ambientSounds = {
     rain: { 
       name: 'Rain', 
       icon: '🌧️', 
       duration: 'continuous',
       url: 'https://your-reliable-audio-host.com/rain.mp3'
     },
     // ... other sounds
   };
   ```

2. **Use the remote URL code** (already in the service):
   ```javascript
   const { sound } = await Audio.Sound.createAsync(
     { uri: soundConfig.url },
     { 
       shouldPlay: true,
       isLooping: true,
       volume: this.volume,
       rate: 1.0,
     }
   );
   ```

## Audio File Requirements

### Format
- **Recommended**: MP3 or WAV
- **Supported**: MP3, WAV, M4A, AAC

### Quality
- **Sample Rate**: 44.1kHz or 48kHz
- **Bitrate**: 128-320 kbps (MP3)
- **Duration**: 30 seconds to 5 minutes (will loop)

### File Size
- **Recommended**: Under 5MB per file
- **Maximum**: 10MB per file

## Where to Get Audio Files

### Free Options
1. **Freesound.org** - Free sound effects and ambient sounds
2. **Zapsplat.com** - Free sound library (requires account)
3. **BBC Sound Effects** - Free ambient sounds
4. **YouTube Audio Library** - Free music and sounds

### Paid Options
1. **AudioJungle** - Professional audio files
2. **PremiumBeat** - High-quality ambient sounds
3. **Artlist** - Subscription-based audio library

## Example Audio Files

Here are some example ambient sounds you could use:

### Rain Sound
- Gentle rain on window
- Forest rain with birds
- Heavy rain with thunder

### White Noise
- Fan sound
- Air conditioning
- Static noise

### Forest
- Birds chirping
- Wind through trees
- Stream flowing

### Ocean
- Waves crashing
- Seagulls
- Beach ambience

### Cafe
- Coffee machine
- Soft chatter
- Background music

### Fireplace
- Crackling fire
- Wood burning
- Cozy ambience

## Testing Your Audio

1. **Add one audio file first** (e.g., `rain.mp3`)
2. **Update the service** to use real audio
3. **Test the app** - select rain sound
4. **Verify** - you should hear actual rain sounds
5. **Add more files** once the first one works

## Troubleshooting

### No Sound Plays
- Check device volume
- Verify audio file format
- Check file path is correct
- Ensure audio file isn't corrupted

### App Crashes
- Audio file might be too large
- Check file format compatibility
- Verify require() path is correct

### Poor Quality
- Use higher bitrate audio files
- Ensure files are properly encoded
- Consider file size vs quality trade-off

## Production Considerations

### File Size
- Bundle audio files with the app
- Consider downloading on first use
- Compress files appropriately

### Licensing
- Ensure you have rights to use audio files
- Check licensing requirements
- Consider royalty-free options

### Performance
- Preload frequently used sounds
- Unload sounds when not needed
- Monitor memory usage

## Quick Start

To get real audio working quickly:

1. **Download one ambient sound** (e.g., rain.mp3)
2. **Place it in** `Study_App/assets/audio/rain.mp3`
3. **Uncomment the real audio code** in `musicService.js`
4. **Test** - select rain sound in the app
5. **Add more sounds** as needed

This will give you actual audio playback instead of simulation! 