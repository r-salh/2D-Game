class AudioPlayer {
    static click = new Audio("./audio/click.wav");
    static negative = new Audio("./audio/negative.wav");
    static next = new Audio("./audio/next.wav");
    static boss = new Audio("./audio/boss.mp3");

    static Click() {
        AudioPlayer.Play(
            AudioPlayer.click
        );
    }

    static Negative() {
        AudioPlayer.Play(
            AudioPlayer.negative
        );
    }

    static Next() {
        AudioPlayer.Play(
            AudioPlayer.next
        );
    }

    static Boss() {
        AudioPlayer.boss.volume = 0.2;
        AudioPlayer.Loop(
            AudioPlayer.boss
        );
    }

    static Play(audio) {
        audio.currentTime = 0;
        audio.play();
    }

    static Loop(audio) {
        AudioPlayer.Play(audio);
        audio.addEventListener('ended', () => AudioPlayer.Play(audio), false);
    }
}