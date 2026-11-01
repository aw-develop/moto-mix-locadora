import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { FleetAdminComponent } from "./fleet-admin.component";
import { AdminService } from "../../core/services/admin.service";
import { AdminSessionService } from "../../core/services/admin-session.service";

describe("FleetAdminComponent", () => {
  it("não exclui ao cancelar e remove somente ao confirmar", () => {
    const closed = vi.fn().mockReturnValue(of(false));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MatDialog,
          useValue: { open: () => ({ afterClosed: closed }) },
        },
      ],
    });
    TestBed.inject(AdminSessionService).setIdentity({
      isAdmin: true,
      signedIn: true,
      name: "Admin teste",
      email: "admin@example.test",
    });
    const component =
      TestBed.createComponent(FleetAdminComponent).componentInstance;
    const service = TestBed.inject(AdminService);
    const moto = service.bikes()[0];
    component.remove(moto);
    expect(service.bikes().length).toBe(3);
    closed.mockReturnValue(of(true));
    component.remove(moto);
    expect(service.bikes().length).toBe(2);
  });
});
