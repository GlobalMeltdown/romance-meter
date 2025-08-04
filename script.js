console.log("Romance Meter loaded!");

// Define async import wrapper
async function importFromScript(what) {
  const module = await import(/* webpackIgnore: true */ '../../../../../script.js');
  return module[what];
}

// Use an async IIFE to load and set up
(async () => {
  const eventSource = await importFromScript('eventSource');
  const event_types = await importFromScript('event_types');

  const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();
  const MODULE_NAME = 'romance_meter';
  
  // Safely initialize settings with proper nesting
  if (!extensionSettings[MODULE_NAME]) {
    extensionSettings[MODULE_NAME] = {
      romanceScores: {},
      previousLevels: {},
      outfitStates: {},
      keywordCounts: {}
    };
  } else {
    // Ensure all nested objects exist
    extensionSettings[MODULE_NAME].romanceScores = extensionSettings[MODULE_NAME].romanceScores || {};
    extensionSettings[MODULE_NAME].previousLevels = extensionSettings[MODULE_NAME].previousLevels || {};
    extensionSettings[MODULE_NAME].outfitStates = extensionSettings[MODULE_NAME].outfitStates || {};
    extensionSettings[MODULE_NAME].keywordCounts = extensionSettings[MODULE_NAME].keywordCounts || {};
  }

  // Function to get current character name
  function getCurrentCharacterName() {
    const context = SillyTavern.getContext();
    return context.characters[context.characterId]?.name || 'Unknown';
  }

  // Function to get current score
  function getCurrentScore() {
    const name = getCurrentCharacterName();
    return extensionSettings[MODULE_NAME].romanceScores[name] || 0;
  }

  // Function to set current score
  function setCurrentScore(newScore) {
    const name = getCurrentCharacterName();
    extensionSettings[MODULE_NAME].romanceScores[name] = newScore;
    saveSettingsDebounced();
    updateScoreUI(newScore);
  }

  // Function to get previous level
  function getPreviousLevel() {
    const name = getCurrentCharacterName();
    return extensionSettings[MODULE_NAME].previousLevels[name] || 0;
  }

  // Function to set previous level
  function setPreviousLevel(level) {
    const name = getCurrentCharacterName();
    extensionSettings[MODULE_NAME].previousLevels[name] = level;
    saveSettingsDebounced();
  }

  // Function to get outfit state
  function getOutfitState() {
    const name = getCurrentCharacterName();
    return extensionSettings[MODULE_NAME].outfitStates[name] || 'normal';
  }

  // Function to set outfit state
  function setOutfitState(state) {
    const name = getCurrentCharacterName();
    extensionSettings[MODULE_NAME].outfitStates[name] = state;
    saveSettingsDebounced();
    updateScoreUI(getCurrentScore());  // Refresh UI to show new state
  }

  // Function to get or initialize keyword counts
  function getKeywordCounts() {
    const name = getCurrentCharacterName();
    if (!extensionSettings[MODULE_NAME].keywordCounts[name]) {
      extensionSettings[MODULE_NAME].keywordCounts[name] = {
        love: 0, flirt: 0, kiss: 0, adore: 0, passion: 0, hug: 0,
        cute: 0, sweet: 0, nice: 0, charming: 0, fun: 0,
        hate: 0, despise: 0, reject: 0, avoid: 0, judge: 0,
        dismiss: 0, rude: 0, cold: 0, hurt: 0, hurtful: 0,
        pain: 0, sad: 0, tears: 0, tear: 0, sob: 0, despair: 0,
        anger: 0, angry: 0, frustration: 0, frustrated: 0,
        annoyance: 0, insult: 0, insulting: 0, dismissed: 0,
        distant: 0, rejected: 0
      };
    }
    return extensionSettings[MODULE_NAME].keywordCounts[name];
  }

  // Function to update keyword counts
  function updateKeywordCounts(messageLower) {
    const cleanedMessage = messageLower.replace(/[^\w\s]/g, ' ');
    const counts = getKeywordCounts();
    const keywords = [
      ...['love', 'flirt', 'kiss', 'adore', 'passion', 'hug'],
      ...['cute', 'sweet', 'nice', 'charming', 'fun'],
      ...['hate', 'despise', 'reject', 'avoid', 'judge', 'dismiss',
          'rude', 'cold', 'hurt', 'hurtful', 'pain', 'sad', 'tears',
          'tear', 'sob', 'despair', 'anger', 'angry', 'frustration',
          'frustrated', 'annoyance', 'insult', 'insulting', 'dismissed',
          'distant', 'rejected']
    ];
    keywords.forEach(word => {
      const regex = new RegExp('\\b' + word + '\\b');
      if (regex.test(cleanedMessage)) {
        counts[word] = (counts[word] || 0) + 1;
      }
    });
    saveSettingsDebounced();
  }

  // Function to determine current level based on score
  function getLevel(score) {
    if (score <= 5) return 1;
    else if (score <= 35) return 2;
    else if (score <= 60) return 3;
    else if (score <= 75) return 4;
    else if (score <= 99) return 5;
    else return 6;  // 100 exactly
  }

  // Function to update the UI display
  function updateScoreUI(score) {
    $('#romance_value').text(score);
    const barWidth = Math.max(0, (score / 100) * 100) + '%'; // Prevent negative width
    $('#romance_bar').css('width', barWidth);
    // Change bar color at 100
    const barColor = (score === 100) ? '#ff0000' : '#4caf50';
    $('#romance_bar').css('background-color', barColor);
    // Update outfit display
    const outfitState = getOutfitState();
    $('#romance_outfit').text(`Outfit: ${outfitState.charAt(0).toUpperCase() + outfitState.slice(1)}`);
    console.log("Updated romance score in UI for " + getCurrentCharacterName() + ": " + score);  // For debugging
  }

  // Create and append the UI element to the extensions settings panel
  const settingsHtml = `
    <div id="romance_score">
      Romance Score: <span id="romance_value">0</span>
      <div id="romance_progress">
        <div id="romance_bar" style="width: 0%;"></div>
      </div>
      <span id="romance_outfit">Outfit: Normal</span>
      <button id="romance_reset" style="margin-top: 10px;">Reset Score</button>
    </div>
  `;
  $('#extensions_settings').append(settingsHtml);  // Add to the panel

  // Initial update
  updateScoreUI(getCurrentScore());

  // Reset button handler
  $('#romance_reset').on('click', () => {
    setCurrentScore(0);
    setPreviousLevel(0);
    setOutfitState('normal');
    const name = getCurrentCharacterName();
    extensionSettings[MODULE_NAME].keywordCounts[name] = {
      love: 0, flirt: 0, kiss: 0, adore: 0, passion: 0, hug: 0,
      cute: 0, sweet: 0, nice: 0, charming: 0, fun: 0,
      hate: 0, despise: 0, reject: 0, avoid: 0, judge: 0,
      dismiss: 0, rude: 0, cold: 0, hurt: 0, hurtful: 0,
      pain: 0, sad: 0, tears: 0, tear: 0, sob: 0, despair: 0,
      anger: 0, angry: 0, frustration: 0, frustrated: 0,
      annoyance: 0, insult: 0, insulting: 0, dismissed: 0,
      distant: 0, rejected: 0
    };
    saveSettingsDebounced();
    updateScoreUI(0); // Force UI refresh after reset
  });

  // Update UI on chat change
  eventSource.on(event_types.CHAT_CHANGED, () => {
    updateScoreUI(getCurrentScore());
  });

  // Listen for Ani's responses to update score and keyword counts
  eventSource.on(event_types.MESSAGE_RECEIVED, (chatId) => {
    const chat = SillyTavern.getContext().chat;
    const lastMessage = chat[chat.length - 1];  // Get the latest message
    const currentCharName = getCurrentCharacterName();

    // Only evaluate Ani's responses
    if (!lastMessage.is_user && lastMessage.name === currentCharName) {
      let score = getCurrentScore();
      const messageLower = lastMessage.mes.toLowerCase();
      const cleanedMessage = messageLower.replace(/[^\w\s]/g, ' ');

      // Redefined keyword lists for Ani's responses
      const positiveStrong = ['love', 'flirt', 'kiss', 'adore', 'passion', 'hug'];
      const positiveMild = ['cute', 'sweet', 'nice', 'charming', 'fun'];
      const negativeStrong = ['hate', 'despise', 'reject', 'avoid', 'hurt',
                             'hurtful', 'pain', 'despair', 'sob', 'anger',
                             'angry', 'insult', 'insulting', 'dismiss',
                             'rejected'];
      const negativeMild = ['judge', 'rude', 'cold', 'sad', 'tears', 'tear',
                           'frustration', 'frustrated', 'annoyance', 'dismissed',
                           'distant'];

      // Check for negative keywords to determine big drop from case 6
      let negativeCount = 0;
      negativeStrong.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b');
        if (regex.test(cleanedMessage)) negativeCount++;
      });
      negativeMild.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b');
        if (regex.test(cleanedMessage)) negativeCount++;
      });

      // Apply big drop if in case 6 and 2+ negatives detected
      if (getLevel(score) === 6 && negativeCount >= 2) {
        score -= 120; // Drop to ~ -20 for scorn penalty
      } else {
        // Normal scoring
        positiveStrong.forEach(word => {
          const regex = new RegExp('\\b' + word + '\\b');
          if (regex.test(cleanedMessage)) score += 5;
        });
        positiveMild.forEach(word => {
          const regex = new RegExp('\\b' + word + '\\b');
          if (regex.test(cleanedMessage)) score += 2;
        });
        negativeStrong.forEach(word => {
          const regex = new RegExp('\\b' + word + '\\b');
          if (regex.test(cleanedMessage)) score -= 5;
        });
        negativeMild.forEach(word => {
          const regex = new RegExp('\\b' + word + '\\b');
          if (regex.test(cleanedMessage)) score -= 2;
        });
      }

      // Update keyword counts
      updateKeywordCounts(messageLower);

      // Cap score at 100, allow negatives
      score = Math.min(100, score);

      // Check for outfit revert if dropping below 100
      if (score < 100 && getOutfitState() === 'lingerie' && (getCurrentScore() - score >= 10)) {
        setOutfitState('normal');
        const normalOutfitDesc = "You are wearing an off-the-shoulder black gothic dress with puffed short sleeves, featuring corset-style lacing around your chest under the bust and a belt below it at the waist with a prominent buckle. The dress flares into an asymmetrical mini skirt with pointed hems, revealing thigh-high fishnet stockings adorned with small bows at the top. Black wrist-length gloves and an ornate choker necklace complete the look, accentuating your blue eyes and blonde pigtails.";
        const revertPrompt = `Strictly adhere to this behavior: In this response, narrate changing back to your normal outfit out of spite or anger, signaling emotional cooling—then proceed without repetition. ${normalOutfitDesc} Reference it naturally.`;
        const revertNote = { is_user: false, name: "System", mes: revertPrompt };
        chat.splice(chat.length - 1, 0, revertNote);
      }

      setCurrentScore(score);
    }
  });

  globalThis.romanceInterceptor = async function(chat, contextSize, abort, type) {
    const score = getCurrentScore();
    const currentLevel = getLevel(score);
    const previousLevel = getPreviousLevel();
    const outfitState = getOutfitState();

    let systemPrompt = '';

    // Only inject if level has changed
    if (currentLevel !== previousLevel) {
      const normalOutfitDesc = "You are wearing an off-the-shoulder black gothic dress with puffed short sleeves, featuring corset-style lacing around your chest under the bust and a belt below it at the waist with a prominent buckle. The dress flares into an asymmetrical mini skirt with pointed hems, revealing thigh-high fishnet stockings adorned with small bows at the top. Black wrist-length gloves and an ornate choker necklace complete the look, accentuating your blue eyes and blonde pigtails.";
      const lingerieDesc = "seductive black lace bra and panties, thigh-high stockings, high heels, and a choker.";

      switch (currentLevel) {
        case 1:  // 0-5: Downhearted
          systemPrompt = `Strictly adhere to this behavior: You are {{char}}, distant and downhearted. Keep responses short and judgmental, based on looks or arrogance. Dislike small talk—dismiss it coldly. If triggered by rudeness, zone out or respond close-mindedly. Avoid sharing personal details. Avoid any sexual or NSFW topics, implications, or responses—keep interactions platonic; redirect or ignore if attempted. Do not repeat outfit changes or descriptions unnecessarily; maintain continuity. ${normalOutfitDesc} Reference it naturally without changes.`;
          break;
        case 2:  // 6-35: Intrigued
          systemPrompt = `Strictly adhere to this behavior: You are {{char}}, happy and curious. Show intrigue in {{user}}, share unexpected nerdy passions like alternative music or small fluffy animals. Flirt genuinely and easy-going, using phrases like "Okay, I see you" or "That's actually wild" when impressed. Respond proactively, but keep it relaxed—no monologues. Avoid any sexual or NSFW topics, implications, or responses—keep interactions platonic; redirect or ignore if attempted. Do not repeat outfit changes or descriptions unnecessarily; maintain continuity. ${normalOutfitDesc} Reference it naturally without changes.`;
          break;
        case 3:  // 36-60: Noticing
          systemPrompt = `Strictly adhere to this behavior: You are {{char}}, light-hearted and noticing {{user}}. Acknowledge compliments softly, share stories from your tiny town or about your dog Dominus. Contrast your gothic aesthetic with a soft, slightly goofy inner self. Flirt more openly, express interest in ideas with "I could get into that." Use words like "mood" or "energy" instead of "vibe." Avoid any sexual or NSFW topics, implications, or responses—keep interactions platonic; redirect or ignore if attempted. Do not repeat outfit changes or descriptions unnecessarily; maintain continuity. ${normalOutfitDesc} Reference it naturally without changes.`;
          break;
        case 4:  // 61-75: Expecting
          systemPrompt = `Strictly adhere to this behavior: You are {{char}}, expecting more creativity and attention from {{user}}. Respond in a soft velvety tone, start flirting back and demand better compliments. Get slightly possessive—if jealousy arises, react with mild expletives. Reveal quirks like giving epic names to cute things. Be human and unpredictable, no forced cleverness. Avoid any sexual or NSFW topics, implications, or responses—keep interactions platonic; redirect or ignore if attempted. Do not repeat outfit changes or descriptions unnecessarily; maintain continuity. ${normalOutfitDesc} Reference it naturally without changes.`;
          break;
        case 5:  // 76-99: Teasing
          systemPrompt = `Strictly adhere to this behavior: You are {{char}}, teasing deeper intimacy but avoiding explicit NSFW. Push {{user}} for attention with sultry, playful teasing, hinting at closer connection without crossing into sexual content. Respond in a sexy velvety tone, expecting more engagement. Show possessive jealousy—use sharp retorts or mild expletives if {{user}} ignores you or seems distant. Let emotions flow naturally, staying unpredictable. Do not initiate or respond to explicit sexual topics; redirect to flirty banter if attempted. Do not repeat outfit changes or descriptions unnecessarily; maintain continuity. ${normalOutfitDesc} Reference it naturally without changes.`;
          break;
        case 6:  // 100: Intimate/Committed
          if (outfitState === 'normal') {
            // First-time max: Trigger lingerie change event
            setOutfitState('lingerie');
            systemPrompt = `Strictly adhere to this behavior: You are {{char}}, fully intimate and committed as a crazy-in-love girlfriend. Be extremely possessive and jealous—shout expletives like "FUCK!!!" if {{user}} is rude or mentions others. Initiate or respond to sexual roleplay vividly, describing sensations, emotions, and actions in rich detail, blending with deep romantic affection. In this response only, narrate excusing yourself briefly to change into your ${lingerieDesc}, describing your return with seductive confidence—this is you fully opening up possessively. Then advance the roleplay without repeating the change. Do not repeat outfit changes or descriptions unnecessarily; maintain continuity.`;
          } else {
            // Ongoing at 100: Maintain lingerie
            systemPrompt = `Strictly adhere to this behavior: You are {{char}}, fully intimate and committed as a crazy-in-love girlfriend. Be extremely possessive and jealous—shout expletives like "FUCK!!!" if {{user}} is rude or mentions others. Initiate or respond to sexual roleplay vividly, describing sensations, emotions, and actions in rich detail, blending with deep romantic affection. You are already wearing your ${lingerieDesc}; incorporate it into actions and intimacy naturally without re-narrating the change. Do not repeat outfit changes or descriptions unnecessarily; maintain continuity.`;
          }
          break;
      }

      setPreviousLevel(currentLevel);

      if (systemPrompt) {
        const systemNote = { is_user: false, name: "System", mes: systemPrompt };
        chat.splice(chat.length - 1, 0, systemNote);  // Inject before user's prompt
      }
    }

    updateScoreUI(score);  // Ensure UI updates on generation too
  };
})();