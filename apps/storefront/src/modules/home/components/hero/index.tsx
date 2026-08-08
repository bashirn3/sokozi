import { Heading, Text } from "@modules/common/components/ui";
import SearchBar from "@modules/home/components/search-bar";

const Hero = () => {
  return (
    <div className="w-full border-b border-ui-border-base bg-gradient-to-br from-emerald-950 via-emerald-900 to-black text-white">
      <div className="content-container py-12 small:py-16 flex flex-col gap-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <Text className="text-emerald-300 text-sm uppercase tracking-[0.2em]">
            Soko Yako Mkononi
          </Text>
          <Heading
            level="h1"
            className="text-4xl small:text-5xl leading-tight font-semibold text-white"
          >
            Welcome to Sokozi
          </Heading>
          <Text className="text-emerald-100 text-base small:text-lg">
            Tanzania&apos;s mobile-first marketplace. Discover trending products,
            pay with mobile money, and get same-day delivery in the city.
          </Text>
        </div>
        <div className="max-w-xl">
          <SearchBar />
        </div>
      </div>
    </div>
  );
};

export default Hero;
