import { useState } from "react";
import { Modal } from "./Modal";
import { GameIcons, IconSizes } from "../constants/icons";

interface TutorialStep {
  title: string;
  description: string;
  icon: JSX.Element;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Oyun Sırası",
    description:
      "Her oyuncu sırayla zar atar. Sırası gelen oyuncunun yanında taç işareti görünür.",
    icon: <GameIcons.Crown className={IconSizes.xl} />,
  },
  {
    title: "Kare Tipleri",
    description: `Hazine: Puan kazanırsın
Tuzak: Puan kaybedersin
Güç: Özel yetenekler kazanırsın
Görev: Mini oyunlar oynarsın`,
    icon: (
      <div className="grid grid-cols-2 gap-4">
        <GameIcons.Treasure className={IconSizes.lg} />
        <GameIcons.Trap className={IconSizes.lg} />
        <GameIcons.Power className={IconSizes.lg} />
        <GameIcons.Challenge className={IconSizes.lg} />
      </div>
    ),
  },
  {
    title: "Hareket",
    description:
      "Zar atıldığında karakterin otomatik olarak ilerler. Yolda karşılaştığın karelerin etkilerini alırsın.",
    icon: <GameIcons.Dice className={IconSizes.xl} />,
  },
  {
    title: "Kazanma",
    description:
      "Oyunu kazanmak için ya son kareye ilk ulaşman ya da en çok puanı toplaman gerekir!",
    icon: <GameIcons.Trophy className={IconSizes.xl} />,
  },
];

interface TutorialProps {
  onClose: () => void;
}

export const Tutorial = ({ onClose }: TutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Nasıl Oynanır? (${currentStep + 1}/${tutorialSteps.length})`}
    >
      <div className="mb-6">
        <div className="flex justify-center mb-4 text-gold">
          {tutorialSteps[currentStep].icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-ottoman-red">
          {tutorialSteps[currentStep].title}
        </h3>
        <p className="text-gray-700 whitespace-pre-line">
          {tutorialSteps[currentStep].description}
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold
            disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors
            flex items-center gap-2"
        >
          <GameIcons.Back className={IconSizes.sm} />
          Geri
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 rounded-lg bg-ottoman-red text-white font-semibold
            hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          {currentStep === tutorialSteps.length - 1 ? (
            "Başla!"
          ) : (
            <>
              İleri
              <GameIcons.Forward className={IconSizes.sm} />
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};
