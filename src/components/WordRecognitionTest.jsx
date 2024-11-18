import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { X } from 'lucide-react';

const DISPLAY_TIME = 2000;
const ANSWER_TIME = 2000;

// 単語セットのデータ
const wordSets = {
  'Set1A': ['いす', 'そら', 'かご', 'とり', 'みち', 'はな', 'さら', 'いぬ', 'かべ', 'つえ', 'うま', 'めし', 'やま', 'うた', 'みず'],
  'Set2A': ['つめ', 'かぜ', 'かさ', 'かに', 'うち', 'つき', 'なべ', 'むし', 'いけ', 'ほん', 'たこ', 'みそ', 'さと', 'はし', 'しる'],
  'Set3A': ['ゆか', 'むら', 'かぎ', 'うし', 'そと', 'ほし', 'とぶ', 'たか', 'まち', 'はり', 'くり', 'すし', 'はま', 'つむ', 'なみ'],
  'Set1B': ['たな', 'くも', 'はこ', 'ねこ', 'もり', 'くさ', 'かめ', 'さる', 'にわ', 'ふで', 'ふね', 'まめ', 'うみ', 'まい', 'しお'],
  'Set2B': ['ふろ', 'ゆき', 'ふた', 'かめ', 'みせ', 'あめ', 'てら', 'へび', 'もと', 'かみ', 'あし', 'さけ', 'かわ', 'たつ', 'あき'],
  'Set3B': ['はし', 'やみ', 'ぬの', 'かも', 'しま', 'かげ', 'つな', 'くま', 'はら', 'のり', 'ゆめ', 'いも', 'みな', 'かく', 'たね']
};

// 条件順序の生成
const generateConditionOrder = (participantId) => {
  const orders = [
    ['RM', 'LV', 'CO'],
    ['RM', 'CO', 'LV'],
    ['LV', 'RM', 'CO'],
    ['LV', 'CO', 'RM'],
    ['CO', 'RM', 'LV'],
    ['CO', 'LV', 'RM']
  ];
  const participantNum = parseInt(participantId.slice(1)) - 1;
  const orderIndex = participantNum % 6;
  const sets = ['Set1A', 'Set2A', 'Set3A'].sort(() => Math.random() - 0.5);
  
  return {
    conditionOrder: orders[orderIndex],
    setOrder: sets
  };
};

const WordRecognitionTest = () => {
  const [phase, setPhase] = useState('login');
  const [participantId, setParticipantId] = useState('');
  const [currentExperiment, setCurrentExperiment] = useState(null);
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [showWord, setShowWord] = useState(false);
  const [testWords, setTestWords] = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME);
  const [experimentData, setExperimentData] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleLogin = () => {
    if (!participantId.match(/^[A-Z]\d{3}$/)) {
      alert('参加者IDの形式が正しくありません（例：A001, B002）');
      return;
    }

    const storedData = localStorage.getItem(`experiment_${participantId}`);
    let experimentInfo;

    if (storedData) {
      experimentInfo = JSON.parse(storedData);
    } else {
      const { conditionOrder, setOrder } = generateConditionOrder(participantId);
      experimentInfo = {
        participantId,
        conditionOrder,
        setOrder,
        currentStep: 0,
        completed: false
      };
      localStorage.setItem(`experiment_${participantId}`, JSON.stringify(experimentInfo));
    }

    setCurrentExperiment(experimentInfo);
    setPhase('confirm');
  };

  const startExperiment = () => {
    const currentSet = currentExperiment.setOrder[currentExperiment.currentStep];
    setWords(wordSets[currentSet]);
    setPhase('memorize');
  };

  const startMemorizing = () => {
    if (words.length === 0) return;
    setCurrentWord(words[0]);
    setShowWord(true);
    let currentIndex = 0;

    const timer = setInterval(() => {
      currentIndex++;
      if (currentIndex < words.length) {
        setCurrentWord(words[currentIndex]);
      } else {
        clearInterval(timer);
        setShowWord(false);
        setPhase('ready');
      }
    }, DISPLAY_TIME);
  };

  const prepareTest = () => {
    const currentSet = currentExperiment.setOrder[currentExperiment.currentStep];
    const distractorSet = currentSet.replace('A', 'B');
    const distractors = wordSets[distractorSet];
    
    const allWords = [...words, ...distractors];
    const shuffled = allWords.sort(() => Math.random() - 0.5);
    
    setTestWords(shuffled);
    setCurrentTestIndex(0);
    setPhase('test');
    startTimer();
  };

  const startTimer = () => {
    setTimeLeft(ANSWER_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          handleTimeout();
          return ANSWER_TIME;
        }
        return prev - 100;
      });
    }, 100);
  };

  const handleTimeout = () => {
    recordResponse('timeout');
    moveToNextQuestion();
  };

  const moveToNextQuestion = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (currentTestIndex < testWords.length - 1) {
      setCurrentTestIndex(currentTestIndex + 1);
      startTimer();
    } else {
      finishExperiment();
    }
  };

  const recordResponse = (response) => {
    const isTimeout = response === 'timeout';
    const isCorrect = !isTimeout && 
      ((response === 'yes' && words.includes(testWords[currentTestIndex])) ||
       (response === 'no' && !words.includes(testWords[currentTestIndex])));

    if (isCorrect) setScore(score + 1);

    const trialData = {
      participantId: currentExperiment.participantId,
      condition: currentExperiment.conditionOrder[currentExperiment.currentStep],
      set: currentExperiment.setOrder[currentExperiment.currentStep],
      step: currentExperiment.currentStep + 1,
      word: testWords[currentTestIndex],
      isTarget: words.includes(testWords[currentTestIndex]),
      response: response,
      isCorrect: isCorrect,
      responseTime: ANSWER_TIME - timeLeft,
      isTimeout: isTimeout,
      timestamp: new Date().toISOString()
    };

    setExperimentData(prev => [...prev, trialData]);
  };

  const handleAnswer = (answer) => {
    recordResponse(answer ? 'yes' : 'no');
    moveToNextQuestion();
  };

  const finishExperiment = () => {
    const experimentKey = `data_${participantId}_${currentExperiment.currentStep + 1}`;
    localStorage.setItem(experimentKey, JSON.stringify(experimentData));

    const updatedExperiment = {
      ...currentExperiment,
      currentStep: currentExperiment.currentStep + 1,
      completed: currentExperiment.currentStep === 2
    };
    localStorage.setItem(`experiment_${participantId}`, JSON.stringify(updatedExperiment));
    
    setPhase('result');
  };

  const resetTest = () => {
    setPhase('login');
    setParticipantId('');
    setCurrentExperiment(null);
    setWords([]);
    setTestWords([]);
    setScore(0);
    setCurrentTestIndex(0);
    setShowWord(false);
    setExperimentData([]);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-2xl p-8 space-y-8 relative">
        <Button 
          variant="ghost" 
          className="absolute top-4 right-4"
          onClick={resetTest}
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6">単語再認テスト</h1>
          
          {phase === 'login' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-lg">参加者ID：</label>
                <Input
                  type="text"
                  placeholder="A001"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  className="text-center text-lg"
                />
              </div>
              <Button onClick={handleLogin} className="text-lg px-8 py-4">
                確認
              </Button>
            </div>
          )}

          {phase === 'confirm' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">実験情報確認</h2>
              <div className="space-y-2">
                <p>参加者ID: {currentExperiment.participantId}</p>
                <p>実験条件: {currentExperiment.conditionOrder[currentExperiment.currentStep]}</p>
                <p>使用セット: {currentExperiment.setOrder[currentExperiment.currentStep]}</p>
                <p>実験回数: {currentExperiment.currentStep + 1}/3回目</p>
              </div>
              <Button onClick={startExperiment} className="mt-4">
                実験開始
              </Button>
            </div>
          )}

          {phase === 'memorize' && !showWord && (
            <div className="space-y-6">
              <p className="text-xl">単語を覚える準備ができたらスタートボタンを押してください</p>
              <p className="text-lg">各単語は2秒間表示されます</p>
              <Button 
                onClick={startMemorizing}
                className="text-lg px-8 py-4"
              >
                スタート
              </Button>
            </div>
          )}

          {phase === 'memorize' && showWord && (
            <div className="flex flex-col items-center justify-center space-y-8">
              <p className="text-2xl mb-4">以下の単語を覚えてください</p>
              <p className="text-6xl font-bold">{currentWord}</p>
            </div>
          )}

          {phase === 'ready' && (
            <div className="space-y-6">
              <p className="text-2xl">テストを始める準備ができましたか？</p>
              <p className="text-lg">各問題の制限時間は2秒です</p>
              <Button 
                onClick={prepareTest}
                className="text-lg px-8 py-4"
              >
                テストを始める
              </Button>
            </div>
          )}

          {phase === 'test' && (
            <div className="space-y-8">
              <div className="space-y-2">
                <Progress value={(timeLeft / ANSWER_TIME) * 100} />
              </div>
              <p className="text-2xl mb-6">この単語は覚えた単語の中にありましたか？</p>
              <p className="text-6xl font-bold mb-8">{testWords[currentTestIndex]}</p>
              <div className="flex justify-center space-x-6">
                <Button 
                  onClick={() => handleAnswer(true)}
                  className="text-xl px-8 py-4"
                >
                  はい
                </Button>
                <Button 
                  onClick={() => handleAnswer(false)}
                  className="text-xl px-8 py-4"
                >
                  いいえ
                </Button>
              </div>
              <p className="text-lg">
                進捗: {currentTestIndex + 1} / {testWords.length}
              </p>
            </div>
          )}

          {phase === 'result' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-4">テスト終了</h2>
              <p className="text-2xl">
                正解数: {score} / {testWords.length}
              </p>
              <p className="text-2xl">
                正答率: {Math.round((score / testWords.length) * 100)}%
              </p>
              <div className="space-y-4">
                <Button 
                  onClick={resetTest}
                  className="text-lg px-8 py-4"
                >
                  最初から始める
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WordRecognitionTest;
