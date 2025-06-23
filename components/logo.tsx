import Image from 'next/image';

import { adelleSans } from '../lib/fonts';

interface LogoPropsType {
  fontColor?: string;
  width?: string;
  height?: string;
}

export function Logo(props: LogoPropsType) {
  const fontColor = props.fontColor || '#6B7280';
  const width = props.width || '140';
  const height = props.height || '40';

  return (
    <div className='flex items-center space-x-3'>
      <Image
        src='/assets/PyInvest-logomark.png'
        alt='PyInvest Logo'
        width={32}
        height={32}
        className='flex-shrink-0'
      />
      <span
        className={`text-2xl font-medium ${adelleSans.className}`}
        style={{ color: fontColor }}
      >
        PyInvest
      </span>
    </div>
  );
}
