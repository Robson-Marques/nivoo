// ProductEnhancedDisplay.tsx
// Exibe recursos avançados: badges, trust triggers, warranty, highlights

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductBadge, ProductEnhancement, ProductHighlightItem } from "@/types/productAdvanced";
import { cn } from "@/lib/utils";
import {
  Star,
  Zap,
  Shield,
  AlertCircle,
  ChevronDown,
  Award,
  Truck,
} from "lucide-react";
import "./ProductEnhancedDisplay.module.css";

interface ProductEnhancedDisplayProps {
  badges?: ProductBadge[];
  enhancement?: ProductEnhancement | null;
  className?: string;
}

const getBadgeIcon = (badgeType: string) => {
  switch (badgeType) {
    case "new":
      return <Star className="w-3 h-3" />;
    case "promotion":
      return <Zap className="w-3 h-3" />;
    case "low_stock":
      return <AlertCircle className="w-3 h-3" />;
    default:
      return <Badge className="w-3 h-3" />;
  }
};

const getTrustIcon = (trigger: string) => {
  switch (trigger.toLowerCase()) {
    case "bestseller":
    case "mais vendido":
      return <Award className="w-4 h-4" />;
    case "frete grátis":
    case "envio grátis":
      return <Truck className="w-4 h-4" />;
    case "garantia":
    case "certificado":
      return <Shield className="w-4 h-4" />;
    default:
      return <Star className="w-4 h-4" />;
  }
};

export function ProductEnhancedDisplay({
  badges = [],
  enhancement,
  className,
}: ProductEnhancedDisplayProps) {
  const [expandedDetailsOpen, setExpandedDetailsOpen] = useState(false);

  const activeBadges = badges.filter((b) => b.isActive);
  const hasTrustTriggers = enhancement?.trustTriggers && enhancement.trustTriggers.length > 0;
  const hasExpandedDescription = enhancement?.expandedDescription;
  const hasWarranty = enhancement?.warrantyText;
  const hasStockWarning = enhancement?.stockWarning;
  const hasHighlights = enhancement?.highlightSection && enhancement.highlightSection.length > 0;

  // Se nenhum recurso ativo, retornar null
  if (
    activeBadges.length === 0 &&
    !hasTrustTriggers &&
    !hasExpandedDescription &&
    !hasWarranty &&
    !hasStockWarning &&
    !hasHighlights
  ) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Badges/Selos Visuais */}
      {activeBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeBadges.map((badge) => (
            <Badge
              key={badge.id}
              className={cn(
                "flex items-center gap-1 text-xs",
                badge.badgeColor || "bg-blue-500"
              )}
            >
              {getBadgeIcon(badge.badgeType)}
              {badge.badgeLabel}
            </Badge>
          ))}
        </div>
      )}

      {/* Alertas de Stock */}
      {hasStockWarning && (
        <div className="p-2 bg-orange-50 border border-orange-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <p className="text-sm text-orange-800">{enhancement.stockWarning}</p>
        </div>
      )}

      {/* Trust Triggers */}
      {hasTrustTriggers && (
        <div className="space-y-2">
          {enhancement.trustTriggers.map((trigger, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md"
            >
              {getTrustIcon(trigger)}
              <span className="text-sm text-green-800 font-medium">{trigger}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warranty Information */}
      {hasWarranty && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-900 mb-1">Garantia</p>
              <p className="text-sm text-blue-800">{enhancement.warrantyText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Highlights Section */}
      {hasHighlights && (
        <div className="border-l-4 border-blue-500 pl-3 space-y-2">
          {enhancement.highlightSection?.map((highlight, idx) => (
            <div key={idx} className="flex items-start gap-2">
              {highlight.icon ? (
                <span className="text-lg">{highlight.icon}</span>
              ) : (
                <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-gray-700">{highlight.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Botão Detalhes Expandidos */}
      {hasExpandedDescription && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setExpandedDetailsOpen(true)}
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Ver Mais Detalhes
          </Button>

          {/* Modal Detalhes */}
          <Dialog open={expandedDetailsOpen} onOpenChange={setExpandedDetailsOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detalhes Completos</DialogTitle>
              </DialogHeader>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {enhancement.expandedDescription}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

export default ProductEnhancedDisplay;
