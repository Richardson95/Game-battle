class GamesController < ApplicationController
  def index
    @avatars = Game::AVATARS
    @recent_games = Game.order(created_at: :desc).limit(5)
    @leaderboard = Score.leaderboard
  end

  def create
    @game = Game.new(game_params)
    @game.status = "active"
    if @game.save
      render json: { id: @game.id, status: "ok" }
    else
      render json: { errors: @game.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    @game = Game.find(params[:id])
    render json: @game
  end

  def leaderboard
    @leaderboard = Score.leaderboard
    render json: @leaderboard
  end

  private

  def game_params
    params.require(:game).permit(:player1_avatar, :player2_avatar, :mode,
                                  :winner, :status, :total_rounds,
                                  :player1_score, :player2_score)
  end
end
