import HomeClient from './home-client';
import HomeStaticContent from './home-static-content';

export default function Home() {
  return (
    <HomeClient>
      <HomeStaticContent />
    </HomeClient>
  );
}
