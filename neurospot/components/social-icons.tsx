import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from '@fortawesome/free-brands-svg-icons';
import { faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { faFaceSmile } from '@fortawesome/free-regular-svg-icons';

export function GoogleIcon() {
  return <FontAwesomeIcon icon={faGoogle} />;
}

export function AppleIcon() {
  return <FontAwesomeIcon icon={faApple} />;
}

export function FingerprintIcon() {
  return <FontAwesomeIcon icon={faFingerprint} />;
}

export function FaceIdIcon() {
  return <FontAwesomeIcon icon={faFaceSmile} />;
} 