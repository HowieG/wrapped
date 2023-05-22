"use client";
import Wrapped from "@/lib/Wrapped";
import React from "react";
import dynamic from "next/dynamic";
import FileUpload from "@/components/Preparation/FileUpload";
import WrappedCreator from "@/lib/WrappedCreator";
import WrappedContainer from "@/components/Wrapped/WrappedContainer";
import FatHeading from "@/components/Wrapped/FatHeading";
import InfoText from "@/components/Wrapped/InfoText";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import IntroInformation from "@/components/Wrapped/IntroInformation";
import SpotifyFramePlayer from "@/lib/Spotify/FramePlayer";
import SpotifyPlayer from "@/components/Wrapped/SpotifyPlayer";
import wait from "@/lib/utils/wait";
import SpotifyInfoText from "@/components/Wrapped/SpotifyInfoText";
import MutedText from "@/components/Wrapped/MutedText";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { trackEvent } from "@/lib/analytics";
dayjs.extend(localizedFormat);

const WrappedPlayerComponent = dynamic(
  () => import("@/components/Wrapped/WrappedPlayerComponent"),
  {
    ssr: false,
  }
);

function TikTokWrappedAppPage() {
  const [page, setPageRaw] = React.useState("intro");
  const setPage = (page: string) => {
    setPageRaw(page);
    window.scrollTo(0, 0);
    trackEvent("page_" + page);
  };
  const [wrapped, setWrapped] = React.useState<Wrapped | null>(null);
  const [spotify, setSpotify] = React.useState<SpotifyFramePlayer | null>(null);

  return (
    <div>
      <SpotifyPlayer />

      {page === "intro" && (
        <IntroInformation
          onContinue={() => setPage("upload")}
          onDemo={async () => {
            trackEvent("demo");
            setPage("loading");

            const creator = new WrappedCreator();
            const wrapped = creator.forDemoMode();
            setWrapped(wrapped);

            const spotify = new SpotifyFramePlayer();
            await spotify.loadLibrary();
            setSpotify(spotify);

            await wait(5000);

            trackEvent("demo_ready");

            setPage("demo");
          }}
        />
      )}

      {page === "upload" && (
        <FileUpload
          onFileSelect={async (file) => {
            setPage("loading");
            trackEvent("file_selected");

            const creator = new WrappedCreator();
            try {
              const wrapped = await creator.fromFile(file);
              setWrapped(wrapped);

              trackEvent("file_loaded");
            } catch (e) {
              trackEvent("load_error");
              console.error(e);
              setPage("error");
              return;
            }

            const spotify = new SpotifyFramePlayer();
            await spotify.loadLibrary();
            setSpotify(spotify);
            trackEvent("spotify_loaded");

            await wait(5000);

            trackEvent("spotify_check");

            trackEvent(
              spotify.canPlaySongs ? "spotify_ready" : "spotify_error"
            );

            trackEvent("opening_player");

            setPage(spotify.canPlaySongs ? "ready" : "spotify");
          }}
        />
      )}

      {page === "error" && (
        <WrappedContainer>
          <FatHeading>Something doesn't look right</FatHeading>
          <MutedText>
            We couldn't read your TikTok data export. Please make sure you
            selected the correct file format and try again.
          </MutedText>
          <Button
            onClick={() => {
              setPage("upload");
              trackEvent("try_again");
            }}
          >
            Try again
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </WrappedContainer>
      )}

      {page === "demo" && (
        <WrappedContainer>
          <FatHeading>View Demo Wrapped</FatHeading>
          <MutedText className="max-w-xl mx-auto">
            You can view a demo of Wrapped for TikTok with sample data if you
            want to.
            <br />
            <br />
            The data is randomly generated and does not represent any real
            TikTok user - if you want to see your own Wrapped, you can reload
            the page at any time and upload your own data export.
          </MutedText>
          <Button
            onClick={() => {
              setPage("play");
              trackEvent("play_demo_click");
            }}
          >
            Play demo
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </WrappedContainer>
      )}

      {page === "loading" && (
        <WrappedContainer>
          <Loader2 size={32} className="animate-spin" />
          <InfoText className="text-base">
            We're preparing your Wrapped...
          </InfoText>
        </WrappedContainer>
      )}

      {page === "spotify" && (
        <SpotifyInfoText
          onContinue={() => {
            setPage("ready");
            trackEvent("continue_without_spotify");
          }}
        />
      )}

      {page === "ready" && (
        <WrappedContainer>
          <FatHeading>Your Wrapped is ready!</FatHeading>
          <InfoText>
            We've crunched the numbers and found some...interesting insights.
            <br />
            Are you ready to see them?
          </InfoText>

          <Button
            onClick={() => {
              setPage("play");
              trackEvent("play");
            }}
          >
            Show me!
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </WrappedContainer>
      )}

      {page === "play" && (
        <WrappedPlayerComponent
          statistics={wrapped!.getStatistics()}
          persona={wrapped!.getPersona()}
          spotify={spotify}
        />
      )}
    </div>
  );
}

export default TikTokWrappedAppPage;
