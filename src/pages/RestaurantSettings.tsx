import React from "react";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicInformationForm } from "@/components/settings/BasicInformationForm";
import { OperatingHoursForm } from "@/components/settings/OperatingHoursForm";
import { DeliverySettingsForm } from "@/components/settings/DeliverySettingsForm";
import { PaymentMethodsManager } from "@/components/settings/PaymentMethodsManager";

export default function RestaurantSettings() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Configurações do Restaurante" />

      <div className="flex-1 p-4 md:p-6 space-y-4">
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="w-full flex flex-nowrap overflow-x-auto md:grid md:grid-cols-4 gap-2 pb-2 px-4 scroll-pl-4">
            <TabsTrigger value="info" className="text-xs sm:text-sm md:text-base min-w-max flex-shrink-0">Informações Básicas</TabsTrigger>
            <TabsTrigger value="hours" className="text-xs sm:text-sm md:text-base min-w-max flex-shrink-0">Horários</TabsTrigger>
            <TabsTrigger value="delivery" className="text-xs sm:text-sm md:text-base min-w-max flex-shrink-0">Entregas</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm md:text-base min-w-max flex-shrink-0">Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <BasicInformationForm />
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            <OperatingHoursForm />
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            <DeliverySettingsForm />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <PaymentMethodsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
