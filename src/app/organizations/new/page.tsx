import { OrganizationForm } from "@/components/organization-form";
import { Card, PageHeader } from "@/components/ui";
import { createOrganization } from "@/lib/actions";

export default function NewOrganizationPage() {
  return (
    <>
      <PageHeader
        title="고객사 등록"
        description="교육을 의뢰하는 기업·기관 정보를 등록합니다."
      />
      <Card>
        <OrganizationForm action={createOrganization} />
      </Card>
    </>
  );
}
