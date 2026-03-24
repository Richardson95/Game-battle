class ScoresController < ApplicationController
  def create
    p1 = params[:player1_avatar]
    p2 = params[:player2_avatar]
    winner = params[:winner]

    if winner == "draw"
      Score.record_result(p1, "draw")
      Score.record_result(p2, "draw")
    elsif winner == p1
      Score.record_result(p1, "win")
      Score.record_result(p2, "loss")
    else
      Score.record_result(p2, "win")
      Score.record_result(p1, "loss")
    end

    leaderboard = Score.leaderboard.map do |s|
      { name: s.avatar_name, wins: s.wins, losses: s.losses,
        draws: s.draws, win_rate: s.win_rate }
    end

    render json: { leaderboard: leaderboard }
  end
end
