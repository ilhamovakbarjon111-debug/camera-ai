-- Camera AI - PostgreSQL Jadvallar

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Foydalanuvchilar
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  google_id VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  level VARCHAR(20) DEFAULT 'beginner', -- beginner | intermediate | pro
  xp INTEGER DEFAULT 0,
  push_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rasmlar
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  appwrite_file_id VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  ai_analyzed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Yoqtirish
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, photo_id)
);

-- Izohlar
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Obunalar
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- AI Tahlil natijalari
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  composition_score INTEGER,
  lighting_score INTEGER,
  overall_score INTEGER,
  composition_feedback TEXT,
  lighting_feedback TEXT,
  color_feedback TEXT,
  suggestions TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indekslar
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX idx_likes_photo_id ON likes(photo_id);
CREATE INDEX idx_comments_photo_id ON comments(photo_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- username va full_name ustunlar
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
UPDATE users SET username = name WHERE username IS NULL;

-- Vazifalar
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id VARCHAR(50) NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Sozlamalar
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notifications BOOLEAN DEFAULT true,
  ai_tips BOOLEAN DEFAULT true,
  private_account BOOLEAN DEFAULT false
);

-- Bildirishnomalar
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger: like
CREATE OR REPLACE FUNCTION notify_like() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM photos WHERE id = NEW.photo_id) THEN
    INSERT INTO notifications (user_id, from_user_id, type, text, photo_id)
    SELECT p.user_id, NEW.user_id, 'like', 'rasmingizni yoqtirdi', NEW.photo_id
    FROM photos p WHERE p.id = NEW.photo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_like ON likes;
CREATE TRIGGER on_like AFTER INSERT ON likes FOR EACH ROW EXECUTE FUNCTION notify_like();

-- Trigger: izoh
CREATE OR REPLACE FUNCTION notify_comment() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM photos WHERE id = NEW.photo_id) THEN
    INSERT INTO notifications (user_id, from_user_id, type, text, photo_id)
    SELECT p.user_id, NEW.user_id, 'comment', 'izoh qoldirdi', NEW.photo_id
    FROM photos p WHERE p.id = NEW.photo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_comment ON comments;
CREATE TRIGGER on_comment AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION notify_comment();

-- Trigger: follow
CREATE OR REPLACE FUNCTION notify_follow() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, from_user_id, type, text)
  VALUES (NEW.following_id, NEW.follower_id, 'follow', 'sizga obuna bo''ldi');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_follow ON follows;
CREATE TRIGGER on_follow AFTER INSERT ON follows FOR EACH ROW EXECUTE FUNCTION notify_follow();
