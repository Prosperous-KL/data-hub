const express = require("express");
const router = express.Router();
const { z } = require("zod");
const validate = require("../../middleware/validate");
const { authRequired } = require("../../middleware/auth");
const bundleService = require("./bundle.service");
const vtuService = require("../vtu/vtu.service");
const { NETWORKS, DATA_BUNDLES } = require("../../utils/constants");

// GET /api/bundles/pricing/:network - Get user's custom pricing for a network
router.get("/pricing/:network", authRequired, async (req, res, next) => {
  try {
    const { network } = req.params;
    const userId = req.user.sub;
    
    if (!NETWORKS.includes(network)) {
      return res.status(400).json({ error: "Invalid network" });
    }

    const userPricing = await bundleService.getUserBundlePricing(userId, network);
    const defaults = DATA_BUNDLES[network] || [];
    
    const pricing = defaults.map(bundle => {
      const custom = userPricing.find(p => p.bundle_code === bundle.code);
      return {
        code: bundle.code,
        volume: bundle.volume,
        basePrice: bundle.basePrice,
        defaultProfit: bundle.profit,
        customProfit: custom?.custom_profit ?? null,
        sellingPrice: custom?.selling_price ?? bundle.amount
      };
    });

    res.json({ network, pricing });
  } catch (error) {
    next(error);
  }
});

const pricingUpdateSchema = z.object({
  body: z.object({
    bundles: z.array(z.object({
      code: z.string().min(1),
      profit: z.coerce.number().min(0)
    })).min(1)
  })
});

// POST /api/bundles/pricing/:network - Set custom pricing for bundles
router.post("/pricing/:network", authRequired, validate(pricingUpdateSchema), async (req, res, next) => {
  try {
    const { network } = req.params;
    const { bundles } = req.validated.body;
    const userId = req.user.sub;
    
    if (!NETWORKS.includes(network)) {
      return res.status(400).json({ error: "Invalid network" });
    }

    const updates = bundles.map(b => ({
      bundleCode: b.code,
      profit: b.profit
    }));

    const result = await bundleService.setBundlePricing(userId, network, updates);
    
    res.json({ 
      message: "Pricing updated successfully",
      network,
      updated: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bundles - Get all bundles with current pricing
router.get("/", authRequired, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const result = {};

    for (const network of NETWORKS) {
      const userPricing = await bundleService.getUserBundlePricing(userId, network);
      const defaults = DATA_BUNDLES[network] || [];
      
      result[network] = defaults.map(bundle => {
        const custom = userPricing.find(p => p.bundle_code === bundle.code);
        return {
          code: bundle.code,
          volume: bundle.volume,
          basePrice: bundle.basePrice,
          defaultProfit: bundle.profit,
          customProfit: custom?.custom_profit ?? null,
          sellingPrice: custom?.selling_price ?? bundle.amount
        };
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/bundles/pricing/:network - Reset to default pricing
router.delete("/pricing/:network", authRequired, async (req, res, next) => {
  try {
    const { network } = req.params;
    const userId = req.user.sub;
    
    if (!NETWORKS.includes(network)) {
      return res.status(400).json({ error: "Invalid network" });
    }

    const deleted = await bundleService.resetToDefaults(userId, network);
    
    res.json({ 
      message: "Pricing reset to defaults",
      network,
      deletedCount: deleted
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
