// IconPath 타입 파일을 생성한다. (npm run gen:icons — npm run build 전에 prebuild로 자동 실행)
import { OUTPUT_FILE, generateIconPaths } from './icon-paths.mjs';

const changed = generateIconPaths();
console.log(changed ? `[gen:icons] ${OUTPUT_FILE} 갱신됨` : '[gen:icons] 변경 사항 없음');
