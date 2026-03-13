-- ============================================================
-- AI Inventory Optimization Platform — PostgreSQL Schema
-- Enterprise-grade schema with indexes and FK relationships
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PRODUCTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id      VARCHAR(50) UNIQUE NOT NULL,
    product_name    TEXT        NOT NULL,
    category        VARCHAR(100),
    sub_category    VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sub_category ON products(sub_category);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CUSTOMERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id     VARCHAR(50) UNIQUE NOT NULL,
    customer_name   TEXT        NOT NULL,
    segment         VARCHAR(50),  -- Consumer | Corporate | Home Office
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_segment ON customers(segment);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ORDERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id        VARCHAR(50) UNIQUE NOT NULL,
    customer_id     VARCHAR(50) REFERENCES customers(customer_id) ON DELETE SET NULL,
    order_date      DATE        NOT NULL,
    ship_date       DATE,
    ship_mode       VARCHAR(50),  -- Standard Class | Second Class | First Class | Same Day
    country         VARCHAR(100),
    city            VARCHAR(100),
    state           VARCHAR(100),
    postal_code     VARCHAR(20),
    region          VARCHAR(50),  -- East | West | Central | South
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_order_date  ON orders(order_date);
CREATE INDEX idx_orders_region      ON orders(region);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_ship_mode   ON orders(ship_mode);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ORDER ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    row_id          INTEGER     UNIQUE NOT NULL,
    order_id        VARCHAR(50) REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id      VARCHAR(50) REFERENCES products(product_id) ON DELETE RESTRICT,
    sales           NUMERIC(12,4) NOT NULL DEFAULT 0,
    quantity        INTEGER       NOT NULL DEFAULT 1,
    discount        NUMERIC(5,4)  NOT NULL DEFAULT 0,
    profit          NUMERIC(12,4) NOT NULL DEFAULT 0,
    profit_margin   NUMERIC(8,4)  GENERATED ALWAYS AS (
                        CASE WHEN sales != 0 THEN profit / sales ELSE 0 END
                    ) STORED,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_profit     ON order_items(profit);
CREATE INDEX idx_order_items_discount   ON order_items(discount);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. INVENTORY STATE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_state (
    id                  UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id          VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
    current_stock       INTEGER     NOT NULL DEFAULT 0,
    reorder_point       INTEGER     NOT NULL DEFAULT 10,
    max_stock           INTEGER     NOT NULL DEFAULT 100,
    avg_daily_demand    NUMERIC(10,4),
    safety_stock        INTEGER,
    last_reorder_date   DATE,
    next_reorder_date   DATE,
    stock_status        VARCHAR(20) DEFAULT 'IN_STOCK',  -- IN_STOCK | LOW | OUT_OF_STOCK | OVERSTOCKED
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (product_id)
);

CREATE INDEX idx_inventory_stock_status ON inventory_state(stock_status);
CREATE INDEX idx_inventory_product_id   ON inventory_state(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. DEMAND FORECASTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demand_forecasts (
    id                  UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id          VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
    forecast_period     VARCHAR(10) NOT NULL,  -- e.g., "2024-03"
    predicted_qty       NUMERIC(12,4),
    lower_bound         NUMERIC(12,4),
    upper_bound         NUMERIC(12,4),
    model_version       VARCHAR(50) DEFAULT 'v1',
    model_rmse          NUMERIC(10,4),
    model_r2            NUMERIC(6,4),
    generated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forecasts_product_id ON demand_forecasts(product_id);
CREATE INDEX idx_forecasts_period     ON demand_forecasts(forecast_period);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. AI RECOMMENDATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id                  UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id          VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL,  -- REORDER | DISCOUNT_REVIEW | DISCONTINUE | PROMOTE
    recommended_qty     INTEGER,
    urgency_level       VARCHAR(10),           -- HIGH | MEDIUM | LOW
    confidence_score    NUMERIC(5,4),
    risk_flags          TEXT,                  -- comma-separated: UNPROFITABLE,SLOW_MOVER
    risk_score          NUMERIC(6,2),
    recommendation_text TEXT,
    status              VARCHAR(20) DEFAULT 'PENDING',  -- PENDING | APPROVED | DISMISSED
    generated_at        TIMESTAMPTZ DEFAULT NOW(),
    actioned_at         TIMESTAMPTZ
);

CREATE INDEX idx_recommendations_product_id ON ai_recommendations(product_id);
CREATE INDEX idx_recommendations_urgency    ON ai_recommendations(urgency_level);
CREATE INDEX idx_recommendations_status     ON ai_recommendations(status);
CREATE INDEX idx_recommendations_type       ON ai_recommendations(recommendation_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. ANALYTICS METRICS  (pre-aggregated, refreshed by scheduled jobs)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id                  UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_date         DATE        NOT NULL,
    dimension_type      VARCHAR(30) NOT NULL,  -- GLOBAL | REGION | CATEGORY | PRODUCT
    dimension_value     VARCHAR(100),          -- e.g., "West", "Technology", product_id
    total_revenue       NUMERIC(15,4),
    total_profit        NUMERIC(15,4),
    total_orders        INTEGER,
    total_qty           INTEGER,
    avg_profit_margin   NUMERIC(8,4),
    avg_discount        NUMERIC(5,4),
    slow_movers_count   INTEGER,
    high_risk_products  INTEGER,
    computed_at         TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (metric_date, dimension_type, dimension_value)
);

CREATE INDEX idx_analytics_date      ON analytics_metrics(metric_date);
CREATE INDEX idx_analytics_dimension ON analytics_metrics(dimension_type, dimension_value);

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEWS
-- ─────────────────────────────────────────────────────────────────────────────

-- Dashboard summary view
CREATE OR REPLACE VIEW vw_dashboard_summary AS
SELECT
    COUNT(DISTINCT o.order_id)          AS total_orders,
    COUNT(DISTINCT o.customer_id)       AS total_customers,
    COUNT(DISTINCT oi.product_id)       AS total_products,
    ROUND(SUM(oi.sales),2)              AS total_revenue,
    ROUND(SUM(oi.profit),2)             AS total_profit,
    ROUND(AVG(oi.profit_margin)*100,2)  AS avg_profit_margin_pct,
    ROUND(AVG(oi.discount)*100,2)       AS avg_discount_pct
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id;

-- Regional demand view
CREATE OR REPLACE VIEW vw_regional_demand AS
SELECT
    o.region,
    o.state,
    p.category,
    SUM(oi.quantity)                    AS total_qty,
    ROUND(SUM(oi.sales),2)              AS total_sales,
    ROUND(SUM(oi.profit),2)             AS total_profit,
    COUNT(DISTINCT o.order_id)          AS order_count,
    ROUND(AVG(oi.profit_margin)*100,2)  AS avg_margin_pct
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p     ON oi.product_id = p.product_id
GROUP BY o.region, o.state, p.category;

-- Product performance view
CREATE OR REPLACE VIEW vw_product_performance AS
SELECT
    p.product_id,
    p.product_name,
    p.category,
    p.sub_category,
    SUM(oi.sales)                       AS total_sales,
    SUM(oi.quantity)                    AS total_qty,
    SUM(oi.profit)                      AS total_profit,
    AVG(oi.profit_margin)               AS avg_margin,
    AVG(oi.discount)                    AS avg_discount,
    COUNT(DISTINCT o.order_id)          AS order_count,
    COUNT(DISTINCT o.customer_id)       AS unique_customers
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o       ON oi.order_id = o.order_id
GROUP BY p.product_id, p.product_name, p.category, p.sub_category;
