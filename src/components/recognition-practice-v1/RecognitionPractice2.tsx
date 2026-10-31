import { recognitionPractice2PageMeta } from "@/lib/pages/practice-pages";
import { ReadingPracticeGame } from "./RecognitionPracticeV1";

/** /reading-practice-2: Reading Practice II, the secondary words. */
const RecognitionPractice2 = () => (
  <ReadingPracticeGame
    page={recognitionPractice2PageMeta}
    anchor="secondary"
    activityType="secondary_reading_practice"
  />
);

export default RecognitionPractice2;
