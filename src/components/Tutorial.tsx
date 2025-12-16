import React, { useState } from 'react';
import { Modal } from './Modal';

interface TutorialProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "ようこそ！ Holiday Todo へ",
            content: (
                <div className="tutorial-step">
                    <div className="emoji-icon">🎉</div>
                    <p>
                        Holiday Todo は、あなたの<strong>空き時間</strong>を活用するタスク管理アプリです。
                    </p>
                    <p>
                        「休日にやりたいこと」を溜めておけば、次の休日に自動でスケジュールを組んでくれます。
                    </p>
                </div>
            )
        },
        {
            title: "1. タスクを追加しよう",
            content: (
                <div className="tutorial-step">
                    <div className="emoji-icon">📝</div>
                    <p>
                        右下の <strong>＋ボタン</strong> からタスクを追加します。
                    </p>
                    <p>
                        優先度（P1〜P5）を設定すると、重要なタスクから順にスケジュールされます。
                    </p>
                    <ul className="tutorial-list">
                        <li><strong>P5 (高)</strong>: 絶対にやりたい！</li>
                        <li><strong>P1 (低)</strong>: 時間があったらでOK</li>
                    </ul>
                </div>
            )
        },
        {
            title: "2. 予定を登録しよう",
            content: (
                <div className="tutorial-step">
                    <div className="emoji-icon">📅</div>
                    <p>
                        <strong>設定 → 予定表の読み込み</strong> から、カレンダー（.icsファイル）を読み込みます。
                    </p>
                    <p>
                        Googleカレンダーなどからエクスポートしたファイルに対応しています。
                        「休み」または「イベントがない日」が休日として判定されます。
                    </p>
                </div>
            )
        },
        {
            title: "3. 自動スケジューリング",
            content: (
                <div className="tutorial-step">
                    <div className="emoji-icon">🤖</div>
                    <p>
                        タスクと予定データが揃うと、アプリが自動的に「どの休日に何をやるか」を計画します。
                    </p>
                    <p>
                        設定画面で「1日の最大タスク数」や「開始時間」をあなたの生活リズムに合わせて調整できます。
                    </p>
                </div>
            )
        },
        {
            title: "準備完了！",
            content: (
                <div className="tutorial-step">
                    <div className="emoji-icon">🚀</div>
                    <p>
                        さあ、まずはタスクを追加してみましょう！
                    </p>
                    <p>
                        このチュートリアルは、設定画面からいつでも見返すことができます。
                    </p>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
            // 少し待ってからステップをリセット（次回開いたときのため）
            setTimeout(() => setStep(0), 300);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={steps[step].title}>
            <div className="tutorial-content">
                {steps[step].content}
            </div>
            <div className="tutorial-footer">
                <div className="step-indicators">
                    {steps.map((_, i) => (
                        <span
                            key={i}
                            className={`indicator ${i === step ? 'active' : ''}`}
                        />
                    ))}
                </div>
                <div className="button-group">
                    {step > 0 && (
                        <button className="btn-secondary" onClick={handleBack}>
                            戻る
                        </button>
                    )}
                    <button className="btn-primary" onClick={handleNext}>
                        {step === steps.length - 1 ? '始める' : '次へ'}
                    </button>
                </div>
            </div>

            <style>{`
                .tutorial-step {
                    text-align: center;
                    padding: 1rem 0;
                }
                .emoji-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    animation: bounce 2s infinite;
                }
                .tutorial-list {
                    text-align: left;
                    background: #f8f9fa;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    margin-top: 1rem;
                }
                .tutorial-footer {
                    margin-top: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    align-items: center;
                }
                .step-indicators {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 0.5rem;
                }
                .indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #ddd;
                    transition: all 0.3s;
                }
                .indicator.active {
                    background: #4a90e2;
                    transform: scale(1.2);
                }
                .button-group {
                    display: flex;
                    gap: 1rem;
                    width: 100%;
                    justify-content: center;
                }
                .button-group button {
                    min-width: 100px;
                }
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
                    40% {transform: translateY(-20px);}
                    60% {transform: translateY(-10px);}
                }
            `}</style>
        </Modal>
    );
};
